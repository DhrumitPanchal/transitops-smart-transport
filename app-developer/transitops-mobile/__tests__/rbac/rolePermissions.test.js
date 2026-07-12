import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
  getPermissionsForRole,
  isSuperAdminOnlyPermission,
  rolePermissions,
  stripSuperAdminOnlyPermissions,
} from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { USER_STATUS } from '@/constants/statuses'
import { resetDemoData, toPublicUser } from '@/mocks/mockDatabase'
import { hasPermission, hasAnyPermission } from '@/utils/helpers'

describe('rolePermissions', () => {
  beforeEach(async () => {
    await resetDemoData()
  })

  it('defines permissions for all five roles', () => {
    expect(Object.keys(rolePermissions).sort()).toEqual(
      [
        ROLES.SUPER_ADMIN,
        ROLES.FLEET_MANAGER,
        ROLES.DISPATCHER,
        ROLES.SAFETY_OFFICER,
        ROLES.FINANCIAL_ANALYST,
      ].sort(),
    )
  })

  it('gives Super Admin every permission', () => {
    expect(getPermissionsForRole(ROLES.SUPER_ADMIN)).toEqual(ALL_PERMISSIONS)
    expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.USERS_APPROVE)).toBe(
      true,
    )
  })

  it('matches Fleet Manager matrix', () => {
    const perms = getPermissionsForRole(ROLES.FLEET_MANAGER)
    expect(perms).toContain(PERMISSIONS.VEHICLES_CREATE)
    expect(perms).toContain(PERMISSIONS.MAINTENANCE_COMPLETE)
    expect(perms).toContain(PERMISSIONS.REPORTS_EXPORT)
    expect(perms).not.toContain(PERMISSIONS.TRIPS_DISPATCH)
    expect(perms).not.toContain(PERMISSIONS.USERS_VIEW)
    expect(perms).not.toContain(PERMISSIONS.FUEL_CREATE)
  })

  it('matches Dispatcher matrix', () => {
    const perms = getPermissionsForRole(ROLES.DISPATCHER)
    expect(perms).toContain(PERMISSIONS.TRIPS_CREATE)
    expect(perms).toContain(PERMISSIONS.TRIPS_DISPATCH)
    expect(perms).toContain(PERMISSIONS.FUEL_CREATE)
    expect(perms).toContain(PERMISSIONS.EXPENSES_CREATE)
    expect(perms).not.toContain(PERMISSIONS.FUEL_EDIT)
    expect(perms).not.toContain(PERMISSIONS.VEHICLES_CREATE)
    expect(perms).not.toContain(PERMISSIONS.REPORTS_EXPORT)
  })

  it('matches Safety Officer matrix', () => {
    const perms = getPermissionsForRole(ROLES.SAFETY_OFFICER)
    expect(perms).toContain(PERMISSIONS.DRIVERS_CREATE)
    expect(perms).toContain(PERMISSIONS.DRIVERS_SUSPEND)
    expect(perms).not.toContain(PERMISSIONS.FUEL_VIEW)
    expect(perms).not.toContain(PERMISSIONS.EXPENSES_VIEW)
    expect(perms).not.toContain(PERMISSIONS.TRIPS_CREATE)
  })

  it('matches Financial Analyst matrix', () => {
    const perms = getPermissionsForRole(ROLES.FINANCIAL_ANALYST)
    expect(perms).toContain(PERMISSIONS.FUEL_CREATE)
    expect(perms).toContain(PERMISSIONS.FUEL_EDIT)
    expect(perms).toContain(PERMISSIONS.FUEL_DELETE)
    expect(perms).toContain(PERMISSIONS.EXPENSES_DELETE)
    expect(perms).toContain(PERMISSIONS.REPORTS_EXPORT)
    expect(perms).not.toContain(PERMISSIONS.VEHICLES_CREATE)
    expect(perms).not.toContain(PERMISSIONS.DRIVERS_SUSPEND)
  })

  it('marks admin permissions as Super Admin only', () => {
    SUPER_ADMIN_ONLY_PERMISSIONS.forEach((permission) => {
      expect(isSuperAdminOnlyPermission(permission)).toBe(true)
      Object.values(ROLES)
        .filter((role) => role !== ROLES.SUPER_ADMIN)
        .forEach((role) => {
          expect(getPermissionsForRole(role)).not.toContain(permission)
        })
    })
  })

  it('strips Super Admin only permissions', () => {
    const mixed = [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.FUEL_VIEW,
      PERMISSIONS.ROLES_EDIT_PERMISSIONS,
    ]
    expect(stripSuperAdminOnlyPermissions(mixed)).toEqual([
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.FUEL_VIEW,
    ])
  })

  it('pending users receive no permissions from toPublicUser', () => {
    const pending = {
      id: 'user_pending',
      name: 'Waiting',
      email: 'waiting@example.com',
      role: null,
      status: USER_STATUS.PENDING,
      createdAt: '2026-07-12T00:00:00.000Z',
    }
    expect(toPublicUser(pending).permissions).toEqual([])
  })

  it('pending users with a role still get empty permissions', () => {
    const pendingWithRole = {
      id: 'user_pending_role',
      name: 'Odd Pending',
      email: 'odd@example.com',
      role: ROLES.DISPATCHER,
      status: USER_STATUS.PENDING,
      createdAt: '2026-07-12T00:00:00.000Z',
    }
    expect(toPublicUser(pendingWithRole).permissions).toEqual([])
  })

  it('hasAnyPermission checks role grants', () => {
    expect(
      hasAnyPermission(ROLES.DISPATCHER, [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.TRIPS_DISPATCH,
      ]),
    ).toBe(true)
    expect(
      hasAnyPermission(ROLES.SAFETY_OFFICER, [
        PERMISSIONS.FUEL_CREATE,
        PERMISSIONS.EXPENSES_CREATE,
      ]),
    ).toBe(false)
  })
})
