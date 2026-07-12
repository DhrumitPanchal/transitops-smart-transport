import LoadingSpinner from './LoadingSpinner'

export default function FormSubmittingOverlay({
  open = false,
  label = 'Saving...',
}) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <LoadingSpinner size="sm" label={label} />
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  )
}
