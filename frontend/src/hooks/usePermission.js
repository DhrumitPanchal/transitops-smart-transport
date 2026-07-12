import { useAuth } from './useAuth'

export function usePermission(permission) {
  const { hasPermission, hasAnyPermission, user } = useAuth()

  return {
    user,
    role: user?.role,
    permissions: user?.permissions || [],
    allowed: permission ? hasPermission(permission) : false,
    hasPermission,
    hasAnyPermission,
    can: hasPermission,
    canAny: hasAnyPermission,
  }
}

export function usePermissions() {
  const { hasPermission, hasAnyPermission, user } = useAuth()

  return {
    role: user?.role,
    permissions: user?.permissions || [],
    hasPermission,
    hasAnyPermission,
    can: hasPermission,
    canAny: hasAnyPermission,
  }
}
