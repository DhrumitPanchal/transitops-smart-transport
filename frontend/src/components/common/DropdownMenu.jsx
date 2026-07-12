import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function DropdownMenu({
  trigger,
  items = [],
  align = 'right',
  className,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1"
      >
        {trigger || (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            Actions
            <ChevronDown className="h-4 w-4" />
          </span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-2 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.id || item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
                item.danger ? 'text-red-600' : 'text-slate-700',
              )}
              onClick={() => {
                item.onClick?.()
                setOpen(false)
              }}
            >
              {item.icon ? <item.icon className="h-4 w-4" /> : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
