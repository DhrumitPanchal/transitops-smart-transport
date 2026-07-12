import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import env from '../../config/env'
import { useAuth } from '../../hooks/useAuth'
import { useNavigationItems } from '../../hooks/useNavigationItems'
import { getRoleLabel, cn } from '../../utils/helpers'
import Avatar from '../common/Avatar'
import IconButton from '../common/IconButton'

export function SidebarNav({ onNavigate }) {
  const items = useNavigationItems()

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition',
                isActive
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export function SidebarFooter() {
  const { user } = useAuth()

  return (
    <div className="border-t border-slate-800 px-4 py-4">
      <div className="flex items-center gap-3">
        <Avatar name={user?.name || 'User'} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {user?.name || 'User'}
          </p>
          <p className="truncate text-xs text-slate-400">
            {getRoleLabel(user?.role)}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SidebarBrand({ onClose }) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
      <span className="text-lg font-semibold tracking-tight">{env.appName}</span>
      {onClose ? (
        <IconButton
          icon={X}
          label="Close sidebar"
          className="text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
          onClick={onClose}
        />
      ) : null}
    </div>
  )
}
