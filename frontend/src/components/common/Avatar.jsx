import { getInitials } from '../../utils/helpers'
import { cn } from '../../utils/helpers'

export default function Avatar({ name = '', size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-teal-700 font-semibold text-white',
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name) || 'TO'}
    </div>
  )
}
