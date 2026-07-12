import { LoaderCircle } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function IconButton({
  icon: Icon,
  label,
  type = 'button',
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  }

  const variantClasses = {
    ghost: 'text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'text-red-600 hover:bg-red-50',
    primary: 'bg-teal-700 text-white hover:bg-teal-800',
  }

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}
