import { ROLE_LABELS, ROLE_LANDING_ROUTES, ROLES } from '../constants/roles'
import { getPermissionsForRole } from '../constants/permissions'
import { STATUS_LABELS } from '../constants/statuses'
import { ROUTES } from '../constants/routes'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function sleep(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isEmpty(value) {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function buildPath(template, params = {}) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    template,
  )
}

export function hasPermission(role, permission) {
  if (!role || !permission) return false
  const permissions = getPermissionsForRole(role)
  return permissions.includes(permission)
}

export function hasAnyPermission(role, permissions = []) {
  if (!role || !Array.isArray(permissions) || permissions.length === 0) {
    return false
  }

  return permissions.some((permission) => hasPermission(role, permission))
}

export function getRoleLandingRoute(role) {
  return ROLE_LANDING_ROUTES[role] || ROUTES.DASHBOARD
}

export function getStatusLabel(status) {
  if (!status) return '—'
  return STATUS_LABELS[status] || String(status).replace(/_/g, ' ')
}

export function getRoleLabel(role) {
  if (!role) return '—'
  return ROLE_LABELS[role] || String(role).replace(/_/g, ' ')
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role)
}
