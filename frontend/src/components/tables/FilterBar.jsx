import { cn } from '../../utils/helpers'

export default function FilterBar({ children, className }) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center',
        className,
      )}
    >
      {children}
    </div>
  )
}
