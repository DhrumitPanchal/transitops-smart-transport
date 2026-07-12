import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-semibold text-slate-900">403</h1>
      <p className="mt-2 text-slate-500">
        You do not have permission to access this page.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="mt-6 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
