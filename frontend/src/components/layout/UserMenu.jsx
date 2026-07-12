import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, UserCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import { getRoleLabel } from '../../utils/helpers'
import Avatar from '../common/Avatar'

export default function UserMenu() {
  const { user, logout } = useAuth()
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user?.name || 'User'} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-slate-800">
            {user?.name || 'Guest'}
          </p>
          <p className="text-xs text-slate-500">{getRoleLabel(user?.role)}</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          <Link
            to={ROUTES.PROFILE}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={async () => {
              setOpen(false)
              await logout()
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
