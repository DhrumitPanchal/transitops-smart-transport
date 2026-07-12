import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as authService from '../services/authService'
import { isMockMode } from '../services/serviceMode'
import { setUnauthorizedHandler } from '../api/apiClient'
import {
  getRoleLandingRoute,
  hasPermission as checkPermission,
} from '../utils/helpers'
import { USER_STATUS } from '../constants/statuses'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import { setAuthSessionHandlers } from './authSessionBridge'
import { AuthContext } from './authContextInstance'

export { AuthContext }

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

function userHasPermission(user, permission) {
  if (!user || !permission) return false
  if (user.status === USER_STATUS.PENDING) return false
  if (user.status === USER_STATUS.ACTIVE && !user.role) return false

  if (user.role === ROLES.SUPER_ADMIN) {
    return true
  }

  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission)
  }

  return checkPermission(user.role, permission)
}

function userHasAnyPermission(user, permissions = []) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0) {
    return false
  }

  return permissions.some((permission) => userHasPermission(user, permission))
}

function resolveLandingRoute(user) {
  if (!user) return ROUTES.LOGIN
  if (user.status === USER_STATUS.PENDING) return ROUTES.DASHBOARD
  if (user.status === USER_STATUS.ACTIVE && !user.role) return ROUTES.PROFILE
  return getRoleLandingRoute(user.role)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const clearSession = useCallback(() => {
    authService.clearMockSession()
    setUser(null)
  }, [])

  const applyUserUpdate = useCallback((patch = {}) => {
    setUser((current) => {
      if (!current) return current

      if (patch.id && String(patch.id) !== String(current.id)) {
        return current
      }

      return sanitizeSessionUser({
        ...current,
        ...patch,
      })
    })
  }, [])

  const forceLogout = useCallback(() => {
    clearSession()
  }, [clearSession])

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
      setIsInitializing(true)

      if (isMockMode()) {
        authService.clearMockSession()
        if (!cancelled) {
          setUser(null)
          setIsInitializing(false)
        }
        return
      }

      try {
        const response = await authService.getCurrentUser()
        if (!cancelled) {
          setUser(sanitizeSessionUser(unwrapUser(response)))
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const isAuthenticated = Boolean(user) && user.status !== USER_STATUS.INACTIVE
  const isPendingApproval = Boolean(
    user && user.status === USER_STATUS.PENDING,
  )

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      const nextUser = sanitizeSessionUser(unwrapUser(response))
      setUser(nextUser)
      return { user: nextUser, data: nextUser }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setIsLoading(true)
    try {
      const response = await authService.register(payload)
      const nextUser = sanitizeSessionUser(unwrapUser(response))
      setUser(nextUser)
      return {
        user: nextUser,
        data: nextUser,
        message: response?.message,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch {
      // Always clear local auth state, even if the API logout fails.
    } finally {
      clearSession()
      setIsLoading(false)
    }
  }, [clearSession])

  const hasPermission = useCallback(
    (permission) => userHasPermission(user, permission),
    [user],
  )

  const hasAnyPermission = useCallback(
    (permissions) => userHasAnyPermission(user, permissions),
    [user],
  )

  const landingRoute = useMemo(() => resolveLandingRoute(user), [user])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      isLoading,
      isPendingApproval,
      login,
      register,
      logout,
      hasPermission,
      hasAnyPermission,
      landingRoute,
      applyUserUpdate,
      forceLogout,
    }),
    [
      user,
      isAuthenticated,
      isInitializing,
      isLoading,
      isPendingApproval,
      login,
      register,
      logout,
      hasPermission,
      hasAnyPermission,
      landingRoute,
      applyUserUpdate,
      forceLogout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
