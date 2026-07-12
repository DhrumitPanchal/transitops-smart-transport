import { useAuth } from './useAuth'

export function usePermissions() {
  const {
    user,
    role,
    permissions,
    hasPermission,
    canAccess,
    isPending,
    isAuthenticated,
  } = useAuth()

  return {
    user,
    role,
    permissions,
    hasPermission,
    canAccess,
    can: hasPermission,
    canAny: (list) => canAccess(list),
    isPending,
    isAuthenticated,
  }
}
