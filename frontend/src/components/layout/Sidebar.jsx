import { NavLink } from 'react-router-dom'
import {
  Bus,
  ClipboardList,
  Fuel,
  LayoutDashboard,
  MapPinned,
  Receipt,
  Settings,
  Shield,
  UserCircle,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import env from '../../config/env'
import { ROUTES } from '../../constants/routes'
import { cn } from '../../utils/helpers'

const navItems = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Vehicles', to: ROUTES.VEHICLES, icon: Bus },
  { label: 'Drivers', to: ROUTES.DRIVERS, icon: Users },
  { label: 'Trips', to: ROUTES.TRIPS, icon: MapPinned },
  { label: 'Maintenance', to: ROUTES.MAINTENANCE, icon: Wrench },
  { label: 'Fuel', to: ROUTES.FUEL, icon: Fuel },
  { label: 'Expenses', to: ROUTES.EXPENSES, icon: Receipt },
  { label: 'Reports', to: ROUTES.REPORTS, icon: ClipboardList },
  { label: 'Users', to: ROUTES.ADMIN_USERS, icon: Settings },
  { label: 'Roles', to: ROUTES.ADMIN_ROLES, icon: Shield },
  { label: 'Profile', to: ROUTES.PROFILE, icon: UserCircle },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <span className="text-lg font-semibold tracking-tight">
            {env.appName}
          </span>
          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-slate-800 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition',
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
