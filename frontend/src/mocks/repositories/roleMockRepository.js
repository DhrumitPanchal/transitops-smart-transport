import { ApiError } from '../../api/apiError'
import { ALL_PERMISSIONS } from '../../constants/permissions'
import { ROLES } from '../../constants/roles'
import { mockDelay } from '../mockDelay'
import { getDb } from '../db'
import {
  applySearch,
  applySort,
  paginateItems,
  singleResponse,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findRoleOrThrow(id) {
  const role = getDb().roles.find((item) => item.id === id)
  if (!role) {
    throw new ApiError({
      status: 404,
      code: 'ROLE_NOT_FOUND',
      message: 'Role not found',
    })
  }
  return role
}

export const roleMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().roles]
    items = applySearch(items, query, ['name', 'key', 'description'])
    items = applySort(items, query, 'name')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findRoleOrThrow(id))
  },

  async updatePermissions(id, permissions = []) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const role = findRoleOrThrow(id)

    if (!Array.isArray(permissions)) {
      throw new ApiError({
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
      throw new ApiError({
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
        throw new ApiError({
          status: 400,
          code: 'SUPER_ADMIN_LOCKED',
          message: 'Super Admin permissions cannot be removed',
          fieldErrors: {
            permissions: 'Super Admin permissions cannot be removed',
          },
        })
      }
    }

    role.permissions = [...new Set(permissions)]
    role.updatedAt = new Date().toISOString()
    return singleResponse(role)
  },
}
