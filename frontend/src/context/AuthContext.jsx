import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as authService from '../services/authService'
import { isMockMode } from '../services/serviceMode'
import { setUnauthorizedHandler } from '../api/apiClient'
import {
  getRoleLandingRoute,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
} from '../utils/helpers'
import { AuthContext } from './authContextInstance'

export { AuthContext }

function unwrapData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

function userHasPermission(user, permission) {
  if (!user || !permission) return false

  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission)
  }

  return checkPermission(user.role, permission)
}

function userHasAnyPermission(user, permissions = []) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0) {
    return false
  }

  if (Array.isArray(user.permissions)) {
    return permissions.some((permission) =>
      user.permissions.includes(permission),
    )
  }

  return checkAnyPermission(user.role, permissions)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const clearSession = useCallback(() => {
    authService.clearMockSession()
    setUser(null)
  }, [])

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

      // Mock mode: session lives only in React/module memory.
      // A refresh starts unauthenticated (may log the mock user out).
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
          setUser(unwrapData(response))
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

  const isAuthenticated = Boolean(user)

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      const nextUser = unwrapData(response)
      setUser(nextUser)
      return { user: nextUser, data: nextUser }
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

  const landingRoute = useMemo(
    () => getRoleLandingRoute(user?.role),
    [user?.role],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      isLoading,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      landingRoute,
    }),
    [
      user,
      isAuthenticated,
      isInitializing,
      isLoading,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      landingRoute,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
