import { cn } from '../../utils/helpers'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className,
  ...props
}) {
  const variants = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant] || variants.primary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
