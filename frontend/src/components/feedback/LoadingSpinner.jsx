import { LoaderCircle } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading',
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  return (
    <div
      className={cn('inline-flex flex-col items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className={cn(
          'animate-spin text-teal-700',
          sizeClasses[size] || sizeClasses.md,
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
