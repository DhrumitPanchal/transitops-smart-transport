import { cn } from '../../utils/helpers'

export default function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <div className="-mb-px flex flex-wrap gap-1" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.value)}
              className={cn(
                'rounded-t-md px-4 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'border-b-2 border-teal-700 text-teal-800'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
