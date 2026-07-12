import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials, getRoleLabel } from '../../utils/helpers'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm font-medium text-slate-900">
            Operations Console
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Smart transport management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">
            {user?.name || 'Guest'}
          </p>
          <p className="text-xs text-slate-500">{getRoleLabel(user?.role)}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
          {getInitials(user?.name || 'TO')}
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
