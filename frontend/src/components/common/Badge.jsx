import { cn } from '../../utils/helpers'

const TONE_CLASSES = {
  slate: 'bg-slate-100 text-slate-700',
  teal: 'bg-teal-50 text-teal-800',
  green: 'bg-emerald-50 text-emerald-800',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-800',
}

export default function Badge({ children, tone = 'slate', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone] || TONE_CLASSES.slate,
        className,
      )}
    >
      {children}
    </span>
  )
}
