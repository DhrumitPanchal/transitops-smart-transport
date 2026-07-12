import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageLoader from '../components/feedback/PageLoader'

export default function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing, landingRoute } = useAuth()

  if (isInitializing) {
    return <PageLoader label="Checking session..." />
  }

  if (isAuthenticated) {
    return <Navigate to={landingRoute} replace />
  }

  return <Outlet />
}
