import { humanizeEnum } from './formatters'

const PERMISSION_GROUPS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'trips', label: 'Trips' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'reports', label: 'Reports' },
]

export function groupPermissions(permissions = []) {
  const grouped = PERMISSION_GROUPS.map((group) => {
    const items = permissions
      .filter((permission) => permission.startsWith(`${group.key}.`))
      .map((permission) => ({
        key: permission,
        label: humanizeEnum(permission.split('.').slice(1).join('_')),
      }))

    return {
      ...group,
      items,
    }
  }).filter((group) => group.items.length > 0)

  const knownPrefixes = new Set(PERMISSION_GROUPS.map((group) => group.key))
  const other = permissions
    .filter((permission) => {
      const prefix = permission.split('.')[0]
      return !knownPrefixes.has(prefix)
    })
    .map((permission) => ({
      key: permission,
      label: humanizeEnum(permission.replace(/\./g, '_')),
    }))

  if (other.length > 0) {
    grouped.push({
      key: 'other',
      label: 'Other',
      items: other,
    })
  }

  return grouped
}
