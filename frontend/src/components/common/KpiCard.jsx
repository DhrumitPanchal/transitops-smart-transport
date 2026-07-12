import { cn } from '../../utils/helpers'

export default function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
          {trend ? (
            <p className="mt-2 text-xs font-medium text-teal-700">{trend}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
