import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '../../utils/helpers'

const TONES = {
  info: {
    className: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: Info,
  },
  success: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
  },
  warning: {
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: TriangleAlert,
  },
  error: {
    className: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertCircle,
  },
}

export default function InlineAlert({
  tone = 'info',
  title,
  children,
  className,
}) {
  const config = TONES[tone] || TONES.info
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border px-4 py-3 text-sm',
        config.className,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
      </div>
    </div>
  )
}
