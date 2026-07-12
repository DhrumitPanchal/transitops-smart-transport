import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as authService from '../services/authService'
import env from '../config/env'
import { setUnauthorizedHandler } from '../api/apiClient'
import { clearMockSession } from '../mocks/session'
import {
  getRoleLandingRoute,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
} from '../utils/helpers'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const clearSession = useCallback(() => {
    if (env.useMocks) {
      clearMockSession()
    }
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
      setIsBootstrapping(true)

      if (env.useMocks) {
        clearMockSession()
        if (!cancelled) {
          setUser(null)
          setIsBootstrapping(false)
        }
        return
      }

      try {
        const currentUser = await authService.getCurrentUser()
        if (!cancelled) {
          setUser(currentUser)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
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
      const result = await authService.login(credentials)
      setUser(result.user)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } finally {
      clearSession()
      setIsLoading(false)
    }
  }, [clearSession])

  const hasPermission = useCallback(
    (permission) => checkPermission(user?.role, permission),
    [user?.role],
  )

  const hasAnyPermission = useCallback(
    (permissions) => checkAnyPermission(user?.role, permissions),
    [user?.role],
  )

  const landingRoute = useMemo(
    () => getRoleLandingRoute(user?.role),
    [user?.role],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading: isLoading || isBootstrapping,
      isBootstrapping,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      landingRoute,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      isBootstrapping,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      landingRoute,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
