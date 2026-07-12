import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import { USER_STATUS } from '../constants/statuses'
import { PERMISSIONS } from '../constants/permissions'
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
    isPendingApproval,
  } = useAuth()

  if (isInitializing) {
    return <PageLoader label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user?.status === USER_STATUS.ACTIVE && !user?.role) {
    return <Navigate to={ROUTES.PROFILE} replace />
  }

  if (isPendingApproval) {
    if (permission === PERMISSIONS.DASHBOARD_VIEW) {
      return <Outlet />
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />
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
