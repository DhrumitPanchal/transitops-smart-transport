import { useAuth } from './useAuth'

export function usePermissions() {
  const { hasPermission, hasAnyPermission, user } = useAuth()

  return {
    role: user?.role,
    permissions: user?.permissions || [],
    hasPermission,
    hasAnyPermission,
    can: hasPermission,
  }
}
