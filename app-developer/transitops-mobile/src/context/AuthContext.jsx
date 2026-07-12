import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as authService from '../services/authService'
import { isMockMode } from '../services/serviceMode'
import { setUnauthorizedHandler } from '../api/apiClient'
import tokenManager from '../api/tokenManager'
import {
  getRoleLandingRoute,
  hasPermission as checkRolePermission,
} from '../utils/helpers'
import {
  ALL_PERMISSIONS,
  getPermissionsForRole,
} from '../constants/permissions'
import { USER_STATUS } from '../constants/statuses'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import { setAuthSessionHandlers } from './authSessionBridge'

export const AuthContext = createContext(null)

function unwrapData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

function unwrapUser(payload) {
  const data = unwrapData(payload)
  if (data && typeof data === 'object' && data.user) {
    return data.user
  }
  if (data && typeof data === 'object' && data.item) {
    return data.item
  }
  return data
}

function sanitizeSessionUser(user) {
  if (!user || typeof user !== 'object') return user
  const next = { ...user }
  delete next.password
  delete next.confirmPassword
  delete next.passwordHash
  return next
}

function resolveUserPermissions(user) {
  if (!user) return []
  if (user.role === ROLES.SUPER_ADMIN) return [...ALL_PERMISSIONS]
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return [...user.permissions]
  }
  return getPermissionsForRole(user.role) || []
}

function userHasPermission(user, permission) {
  if (!user || !permission) return false
  if (user.status === USER_STATUS.PENDING) return false
  if (user.status === USER_STATUS.INACTIVE) return false
  if (user.status === USER_STATUS.ACTIVE && !user.role) return false

  if (user.role === ROLES.SUPER_ADMIN) return true

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permission)
  }

  return checkRolePermission(user.role, permission)
}

function userCanAccess(user, permissionOrPermissions) {
  if (!user) return false
  if (user.status === USER_STATUS.INACTIVE) return false

  // Pending users: limited access — no module permissions
  if (user.status === USER_STATUS.PENDING) {
    return false
  }

  if (Array.isArray(permissionOrPermissions)) {
    if (permissionOrPermissions.length === 0) return Boolean(user)
    return permissionOrPermissions.some((permission) =>
      userHasPermission(user, permission),
    )
  }

  if (!permissionOrPermissions) return Boolean(user)
  return userHasPermission(user, permissionOrPermissions)
}

function resolveLandingRoute(user) {
  if (!user) return ROUTES.LOGIN
  if (user.status === USER_STATUS.PENDING) return ROUTES.DASHBOARD
  if (user.status === USER_STATUS.ACTIVE && !user.role) return ROUTES.PROFILE
  return getRoleLandingRoute(user.role)
}

function isInactiveUser(user) {
  return Boolean(user && user.status === USER_STATUS.INACTIVE)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const clearSession = useCallback(() => {
    authService.clearMockSession()
    setUser(null)
  }, [])

  const forceLogout = useCallback(async () => {
    try {
      await tokenManager.clearTokens()
    } catch {
      // ignore storage errors
    }
    clearSession()
  }, [clearSession])

  const applyUserUpdate = useCallback(
    (patch = {}) => {
      setUser((current) => {
        if (!current) return current
        if (patch.id && String(patch.id) !== String(current.id)) {
          return current
        }
        const next = sanitizeSessionUser({ ...current, ...patch })
        if (isInactiveUser(next)) {
          queueMicrotask(() => {
            forceLogout()
          })
          return null
        }
        return next
      })
    },
    [forceLogout],
  )

  const setUserFromSession = useCallback(
    (sessionOrUser) => {
      const nextUser = sanitizeSessionUser(unwrapUser(sessionOrUser))
      if (!nextUser) {
        setUser(null)
        return null
      }
      if (isInactiveUser(nextUser)) {
        forceLogout()
        return null
      }
      setUser(nextUser)
      return nextUser
    },
    [forceLogout],
  )

  useEffect(() => {
    setAuthSessionHandlers({
      getCurrentUser: () => userRef.current,
      applyUserUpdate,
      forceLogout,
    })

    return () => {
      setAuthSessionHandlers({
        getCurrentUser: () => null,
        applyUserUpdate: null,
        forceLogout: null,
      })
    }
  }, [applyUserUpdate, forceLogout])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [clearSession])

  useEffect(() => {
    let cancelled = false

    async function bootstrapAuth() {
      setIsBootstrapping(true)

      try {
        if (isMockMode()) {
          try {
            const response = await authService.getCurrentUser()
            if (cancelled) return
            const nextUser = sanitizeSessionUser(unwrapUser(response))
            if (isInactiveUser(nextUser)) {
              await forceLogout()
              return
            }
            setUser(nextUser)
          } catch {
            if (!cancelled) setUser(null)
          }
          return
        }

        const hasSession = await tokenManager.hasTokens()
        if (!hasSession) {
          if (!cancelled) setUser(null)
          return
        }

        const response = await authService.getCurrentUser()
        if (cancelled) return
        const nextUser = sanitizeSessionUser(unwrapUser(response))
        if (isInactiveUser(nextUser)) {
          await forceLogout()
          return
        }
        setUser(nextUser)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [forceLogout])

  const login = useCallback(
    async (credentials) => {
      setIsActionLoading(true)
      try {
        const response = await authService.login(credentials)
        const nextUser = setUserFromSession(response)
        if (!nextUser) {
          throw Object.assign(new Error('Your account is inactive.'), {
            status: 403,
            code: 'USER_INACTIVE',
          })
        }
        return { user: nextUser, data: nextUser, message: response?.message }
      } finally {
        setIsActionLoading(false)
      }
    },
    [setUserFromSession],
  )

  const register = useCallback(
    async (payload) => {
      setIsActionLoading(true)
      try {
        const response = await authService.register(payload)
        const nextUser = setUserFromSession(response)
        return {
          user: nextUser,
          data: nextUser,
          message: response?.message,
        }
      } finally {
        setIsActionLoading(false)
      }
    },
    [setUserFromSession],
  )

  const logout = useCallback(async () => {
    setIsActionLoading(true)
    try {
      await authService.logout()
    } catch {
      // Always clear local auth state, even if the API logout fails.
    } finally {
      clearSession()
      setIsActionLoading(false)
    }
  }, [clearSession])

  const refreshUser = useCallback(async () => {
    setIsActionLoading(true)
    try {
      const response = await authService.getCurrentUser()
      return setUserFromSession(response)
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        await forceLogout()
      }
      throw error
    } finally {
      setIsActionLoading(false)
    }
  }, [forceLogout, setUserFromSession])

  const hasPermission = useCallback(
    (permission) => userHasPermission(user, permission),
    [user],
  )

  const canAccess = useCallback(
    (permissionOrPermissions) => userCanAccess(user, permissionOrPermissions),
    [user],
  )

  const status = user?.status ?? null
  const role = user?.role ?? null
  const permissions = useMemo(() => resolveUserPermissions(user), [user])
  const isAuthenticated = Boolean(user) && user.status !== USER_STATUS.INACTIVE
  const isPending = Boolean(user && user.status === USER_STATUS.PENDING)
  const landingRoute = useMemo(() => resolveLandingRoute(user), [user])
  const isLoading = isBootstrapping || isActionLoading

  const value = useMemo(
    () => ({
      user,
      permissions,
      status,
      role,
      isAuthenticated,
      isPending,
      isLoading,
      isBootstrapping,
      landingRoute,
      login,
      register,
      logout,
      refreshUser,
      setUserFromSession,
      hasPermission,
      canAccess,
      applyUserUpdate,
      forceLogout,
    }),
    [
      user,
      permissions,
      status,
      role,
      isAuthenticated,
      isPending,
      isLoading,
      isBootstrapping,
      landingRoute,
      login,
      register,
      logout,
      refreshUser,
      setUserFromSession,
      hasPermission,
      canAccess,
      applyUserUpdate,
      forceLogout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
