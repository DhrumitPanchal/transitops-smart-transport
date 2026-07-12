import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import PageContainer from '../components/common/PageContainer'
import Button from '../components/common/Button'

export default function UnauthorizedPage() {
  const { landingRoute } = useAuth()

  return (
    <PageContainer>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-amber-50 p-3 text-amber-700">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
          403
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Unauthorized
        </h1>
        <p className="mt-2 max-w-md text-slate-500">
          You do not have permission to access this page. Contact your TransitOps
          administrator if you believe this is a mistake.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={landingRoute || ROUTES.DASHBOARD}>
            <Button>Go to home</Button>
          </Link>
          <Link to={ROUTES.PROFILE}>
            <Button variant="secondary">View profile</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
