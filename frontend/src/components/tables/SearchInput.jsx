import { Search } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  ...props
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        {...props}
      />
    </div>
  )
}
