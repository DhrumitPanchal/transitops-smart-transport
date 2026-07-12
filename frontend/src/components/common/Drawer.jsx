import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/helpers'
import IconButton from './IconButton'

export default function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  className,
}) {
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer overlay"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute inset-y-0 flex w-full max-w-md flex-col bg-white shadow-xl',
          side === 'left' ? 'left-0' : 'right-0',
          className,
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <IconButton icon={X} label="Close drawer" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
