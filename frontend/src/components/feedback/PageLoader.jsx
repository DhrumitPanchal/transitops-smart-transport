import LoadingSpinner from './LoadingSpinner'

export default function PageLoader({ label = 'Loading page...' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" label={label} />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
