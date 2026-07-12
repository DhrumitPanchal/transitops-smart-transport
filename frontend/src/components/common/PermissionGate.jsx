import { useAuth } from '../../hooks/useAuth'

export default function PermissionGate({
  permission,
  permissions = [],
  fallback = null,
  children,
}) {
  const { hasPermission, hasAnyPermission } = useAuth()

  const allowed = permission
    ? hasPermission(permission)
    : permissions.length > 0
      ? hasAnyPermission(permissions)
      : true

  if (!allowed) {
    return fallback
  }

  return children
}
