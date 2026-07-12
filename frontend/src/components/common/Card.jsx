import { cn } from '../../utils/helpers'

export default function Card({
  children,
  className,
  padding = true,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        padding && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
