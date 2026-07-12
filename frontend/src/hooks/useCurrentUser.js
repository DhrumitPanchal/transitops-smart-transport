import { useAuth } from './useAuth'

export function useCurrentUser() {
  const { user, isAuthenticated, isInitializing, landingRoute } = useAuth()

  return {
    user,
    isAuthenticated,
    isInitializing,
    landingRoute,
    role: user?.role,
    permissions: user?.permissions || [],
  }
}
