import { cn } from '../../utils/helpers'

export default function PageContainer({ children, className, maxWidth = 'full' }) {
  const widthClasses = {
    full: 'max-w-none',
    xl: 'max-w-7xl',
    lg: 'max-w-5xl',
    md: 'max-w-3xl',
  }

  return (
    <div className={cn('mx-auto w-full', widthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}
