import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import PageLoader from '../components/feedback/PageLoader'

export default function PermissionRoute({
  permission,
  permissions = [],
  roles = [],
}) {
  const {
    isAuthenticated,
    isInitializing,
    hasPermission,
    hasAnyPermission,
    user,
  } = useAuth()

  if (isInitializing) {
    return <PageLoader label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  const allowed = permission
    ? hasPermission(permission)
    : permissions.length > 0
      ? hasAnyPermission(permissions)
      : true

  if (!allowed) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return <Outlet />
}
