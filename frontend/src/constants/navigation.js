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
} from 'lucide-react'
import { PERMISSIONS } from './permissions'
import { ROUTES } from './routes'
import { ROLES } from './roles'

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    to: ROUTES.VEHICLES,
    icon: Bus,
    permission: PERMISSIONS.VEHICLES_VIEW,
  },
  {
    id: 'drivers',
    label: 'Drivers',
    to: ROUTES.DRIVERS,
    icon: Users,
    permission: PERMISSIONS.DRIVERS_VIEW,
  },
  {
    id: 'trips',
    label: 'Trips',
    to: ROUTES.TRIPS,
    icon: MapPinned,
    permission: PERMISSIONS.TRIPS_VIEW,
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    to: ROUTES.MAINTENANCE,
    icon: Wrench,
    permission: PERMISSIONS.MAINTENANCE_VIEW,
  },
  {
    id: 'fuel',
    label: 'Fuel Logs',
    to: ROUTES.FUEL,
    icon: Fuel,
    permission: PERMISSIONS.FUEL_VIEW,
  },
  {
    id: 'expenses',
    label: 'Expenses',
    to: ROUTES.EXPENSES,
    icon: Receipt,
    permission: PERMISSIONS.EXPENSES_VIEW,
  },
  {
    id: 'reports',
    label: 'Reports',
    to: ROUTES.REPORTS,
    icon: ClipboardList,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    id: 'users',
    label: 'Users',
    to: ROUTES.ADMIN_USERS,
    icon: Settings,
    permission: PERMISSIONS.USERS_VIEW,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: 'roles',
    label: 'Roles',
    to: ROUTES.ADMIN_ROLES,
    icon: Shield,
    permission: PERMISSIONS.ROLES_VIEW,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: 'profile',
    label: 'Profile',
    to: ROUTES.PROFILE,
    icon: UserCircle,
  },
]

export const LIFECYCLE_ACTIONS = {
  RETIRE: 'retire',
  SUSPEND: 'suspend',
  CHANGE_STATUS: 'change_status',
  DISPATCH: 'dispatch',
  COMPLETE: 'complete',
  CANCEL: 'cancel',
  DELETE: 'delete',
}

export const DELETABLE_RESOURCES = ['fuel', 'expenses']
