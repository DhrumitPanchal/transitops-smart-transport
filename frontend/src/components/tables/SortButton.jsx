import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function SortButton({
  label,
  active = false,
  direction = 'asc',
  onClick,
  className,
}) {
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900',
        className,
      )}
    >
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}
