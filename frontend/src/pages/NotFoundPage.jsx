import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import Button from '../components/common/Button'
import PageLoader from '../components/feedback/PageLoader'

export default function NotFoundPage() {
  const { isAuthenticated, landingRoute, isInitializing } = useAuth()

  if (isInitializing) {
    return <PageLoader label="Checking session..." />
  }

  const homePath = isAuthenticated
    ? landingRoute || ROUTES.DASHBOARD
    : ROUTES.LOGIN

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-4 rounded-full bg-slate-200 p-3 text-slate-600">
        <FileQuestion className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-slate-500">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link to={homePath} className="mt-6">
        <Button>{isAuthenticated ? 'Go to home' : 'Go to login'}</Button>
      </Link>
    </div>
  )
}
