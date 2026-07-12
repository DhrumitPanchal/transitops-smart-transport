import { cn } from '../../utils/helpers'

export default function SectionTitle({
  title,
  description,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
