import { AlertTriangle } from 'lucide-react'
import Button from '../common/Button'

export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
  actionLabel = 'Retry',
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-red-50 p-3 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
