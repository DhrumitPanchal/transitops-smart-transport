import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import Button from '../common/Button'

export default function AccessDenied({
  title = 'Access denied',
  description = 'You do not have permission to view this content.',
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 rounded-full bg-amber-50 p-3 text-amber-700">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      <Link to={ROUTES.DASHBOARD} className="mt-5">
        <Button variant="secondary">Go to Dashboard</Button>
      </Link>
    </div>
  )
}
