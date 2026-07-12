import { cn } from '../../utils/helpers'

export default function FormSection({
  title,
  description,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'mb-6 rounded-xl border border-slate-200 bg-white p-5',
        className,
      )}
    >
      {(title || description) && (
        <div className="mb-4">
          {title ? (
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  )
}
