import { useEffect } from 'react'
import { useLocation, useNavigate, matchPath } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import { PERMISSIONS } from '../constants/permissions'
import { ROLES } from '../constants/roles'

const ROUTE_PERMISSION_RULES = [
  { path: ROUTES.DASHBOARD, permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: ROUTES.VEHICLES, permission: PERMISSIONS.VEHICLES_VIEW },
  { path: ROUTES.VEHICLES_NEW, permission: PERMISSIONS.VEHICLES_CREATE },
  { path: ROUTES.VEHICLE_EDIT, permission: PERMISSIONS.VEHICLES_EDIT },
  { path: ROUTES.VEHICLE_DETAIL, permission: PERMISSIONS.VEHICLES_VIEW },
  { path: ROUTES.DRIVERS, permission: PERMISSIONS.DRIVERS_VIEW },
  { path: ROUTES.DRIVERS_NEW, permission: PERMISSIONS.DRIVERS_CREATE },
  { path: ROUTES.DRIVER_EDIT, permission: PERMISSIONS.DRIVERS_EDIT },
  { path: ROUTES.DRIVER_DETAIL, permission: PERMISSIONS.DRIVERS_VIEW },
  { path: ROUTES.TRIPS, permission: PERMISSIONS.TRIPS_VIEW },
  { path: ROUTES.TRIPS_NEW, permission: PERMISSIONS.TRIPS_CREATE },
  { path: ROUTES.TRIP_EDIT, permission: PERMISSIONS.TRIPS_EDIT_DRAFT },
  { path: ROUTES.TRIP_DETAIL, permission: PERMISSIONS.TRIPS_VIEW },
  { path: ROUTES.MAINTENANCE, permission: PERMISSIONS.MAINTENANCE_VIEW },
  { path: ROUTES.MAINTENANCE_NEW, permission: PERMISSIONS.MAINTENANCE_CREATE },
  { path: ROUTES.MAINTENANCE_EDIT, permission: PERMISSIONS.MAINTENANCE_EDIT },
  { path: ROUTES.MAINTENANCE_DETAIL, permission: PERMISSIONS.MAINTENANCE_VIEW },
  { path: ROUTES.FUEL, permission: PERMISSIONS.FUEL_VIEW },
  { path: ROUTES.FUEL_NEW, permission: PERMISSIONS.FUEL_CREATE },
  { path: ROUTES.FUEL_EDIT, permission: PERMISSIONS.FUEL_EDIT },
  { path: ROUTES.FUEL_DETAIL, permission: PERMISSIONS.FUEL_VIEW },
  { path: ROUTES.EXPENSES, permission: PERMISSIONS.EXPENSES_VIEW },
  { path: ROUTES.EXPENSES_NEW, permission: PERMISSIONS.EXPENSES_CREATE },
  { path: ROUTES.EXPENSE_EDIT, permission: PERMISSIONS.EXPENSES_EDIT },
  { path: ROUTES.EXPENSE_DETAIL, permission: PERMISSIONS.EXPENSES_VIEW },
  { path: ROUTES.REPORTS, permission: PERMISSIONS.REPORTS_VIEW },
  {
    path: ROUTES.ADMIN_USERS,
    permission: PERMISSIONS.USERS_VIEW,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    path: ROUTES.ADMIN_USERS_NEW,
    permission: PERMISSIONS.USERS_CREATE,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    path: ROUTES.ADMIN_USER_EDIT,
    permission: PERMISSIONS.USERS_EDIT,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    path: ROUTES.ADMIN_USER_DETAIL,
    permission: PERMISSIONS.USERS_VIEW,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    path: ROUTES.ADMIN_ROLES,
    permission: PERMISSIONS.ROLES_VIEW,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    path: ROUTES.ADMIN_ROLE_DETAIL,
    permission: PERMISSIONS.ROLES_VIEW,
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    path: ROUTES.ADMIN_ROLE_PERMISSIONS,
    permission: PERMISSIONS.ROLES_EDIT_PERMISSIONS,
    roles: [ROLES.SUPER_ADMIN],
  },
]

function resolveRouteRule(pathname) {
  return (
    ROUTE_PERMISSION_RULES.find((rule) =>
      matchPath({ path: rule.path, end: true }, pathname),
    ) || null
  )
}

/**
 * When auth permissions change in realtime, redirect away from pages
 * the user can no longer access — without a full browser reload.
 */
export default function RoutePermissionGuard({ children }) {
  const { hasPermission, isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const rule = resolveRouteRule(location.pathname)
    if (!rule) return

    if (rule.roles?.length && !rule.roles.includes(user.role)) {
      navigate(ROUTES.UNAUTHORIZED, { replace: true })
      return
    }

    if (rule.permission && !hasPermission(rule.permission)) {
      navigate(ROUTES.UNAUTHORIZED, { replace: true })
    }
  }, [hasPermission, isAuthenticated, location.pathname, navigate, user])

  return children
}
