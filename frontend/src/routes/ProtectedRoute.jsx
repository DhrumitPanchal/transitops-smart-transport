import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import { USER_STATUS } from '../constants/statuses'
import PageLoader from '../components/feedback/PageLoader'

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing, user, forceLogout } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <PageLoader label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  if (user?.status === USER_STATUS.INACTIVE) {
    forceLogout?.('inactive')
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
