import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from './useAuth'
import { ROUTES } from '../../constants/routes'

/**
 * Ensures the current user has the given permission (or any of an array).
 * Redirects to unauthorized / login when access is denied.
 */
export function useRequirePermission(permissionOrPermissions, options = {}) {
  const {
    redirectTo = ROUTES.UNAUTHORIZED,
    loginRedirect = ROUTES.LOGIN,
    enabled = true,
  } = options

  const { isAuthenticated, isLoading, canAccess, isPending, landingRoute } =
    useAuth()
  const router = useRouter()

  const allowed = canAccess(permissionOrPermissions)

  useEffect(() => {
    if (!enabled || isLoading) return

    if (!isAuthenticated) {
      router.replace(loginRedirect)
      return
    }

    if (isPending) {
      router.replace(landingRoute || ROUTES.DASHBOARD)
      return
    }

    if (!allowed) {
      router.replace(redirectTo)
    }
  }, [
    allowed,
    enabled,
    isAuthenticated,
    isLoading,
    isPending,
    landingRoute,
    loginRedirect,
    redirectTo,
    router,
  ])

  return {
    allowed,
    isLoading,
    isAuthenticated,
    isPending,
  }
}
