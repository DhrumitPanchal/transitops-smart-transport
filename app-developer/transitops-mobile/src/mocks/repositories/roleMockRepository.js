import {
  ALL_PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
  stripSuperAdminOnlyPermissions,
} from '../../constants/permissions'
import { ROLES } from '../../constants/roles'
import { mockDelay } from '../mockDelay'
import { ensureMockDbReady, getDb, persistDb } from '../mockDatabase'
import {
  applySearch,
  applySort,
  paginateItems,
  singleResponse,
  throwMockError,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findRoleOrThrow(id) {
  const role = getDb().roles.find((item) => item.id === id)
  if (!role) {
    throwMockError({
      status: 404,
      code: 'ROLE_NOT_FOUND',
      message: 'Role not found',
    })
  }
  return role
}

export const roleMockRepository = {
  async list(query = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().roles]
    items = applySearch(items, query, ['name', 'key', 'description'])
    items = applySort(items, query, 'name')
    return paginateItems(items, query)
  },

  async getById(id) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findRoleOrThrow(id))
  },

  async updatePermissions(id, permissions = []) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const role = findRoleOrThrow(id)

    if (!Array.isArray(permissions)) {
      throwMockError({
        status: 400,
        code: 'INVALID_PERMISSIONS',
        message: 'Permissions must be an array',
        fieldErrors: { permissions: 'Permissions must be an array' },
      })
    }

    const invalid = permissions.filter(
      (permission) => !ALL_PERMISSIONS.includes(permission),
    )
    if (invalid.length > 0) {
      throwMockError({
        status: 400,
        code: 'INVALID_PERMISSIONS',
        message: 'One or more permissions are invalid',
        fieldErrors: { permissions: 'One or more permissions are invalid' },
      })
    }

    if (role.key === ROLES.SUPER_ADMIN) {
      const missing = ALL_PERMISSIONS.filter(
        (permission) => !permissions.includes(permission),
      )
      if (missing.length > 0) {
        throwMockError({
          status: 400,
          code: 'SUPER_ADMIN_LOCKED',
          message: 'Super Admin permissions cannot be removed',
          fieldErrors: {
            permissions: 'Super Admin permissions cannot be removed',
          },
        })
      }
      role.permissions = [...ALL_PERMISSIONS]
      role.updatedAt = new Date().toISOString()
      await persistDb()
      return singleResponse(role)
    }

    const forbidden = permissions.filter((permission) =>
      SUPER_ADMIN_ONLY_PERMISSIONS.includes(permission),
    )
    if (forbidden.length > 0) {
      throwMockError({
        status: 403,
        code: 'SUPER_ADMIN_ONLY_PERMISSIONS',
        message: 'Users and roles permissions are reserved for Super Admin',
        fieldErrors: {
          permissions: 'Users and roles permissions are reserved for Super Admin',
        },
      })
    }

    role.permissions = [
      ...new Set(stripSuperAdminOnlyPermissions(permissions)),
    ]
    role.updatedAt = new Date().toISOString()
    await persistDb()
    return singleResponse(role)
  },
}
