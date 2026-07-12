import { ApiError } from '../../api/apiError'
import { ROLES } from '../../constants/roles'
import { USER_STATUS } from '../../constants/statuses'
import { mockDelay } from '../mockDelay'
import { getDb, toPublicUser } from '../db'
import {
  applySearch,
  applySort,
  createId,
  normalizeEmail,
  paginateItems,
  singleResponse,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findUserOrThrow(id) {
  const user = getDb().users.find((item) => item.id === id)
  if (!user) {
    throw new ApiError({
      status: 404,
      code: 'USER_NOT_FOUND',
      message: 'User not found',
    })
  }
  return user
}

export const userMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = getDb().users.map((user) => toPublicUser(user))
    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }
    if (query.role) {
      items = items.filter((item) => item.role === query.role)
    }
    items = applySearch(items, query, ['name', 'email', 'role'])
    items = applySort(items, query, 'name')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(toPublicUser(findUserOrThrow(id)))
  },

  async create(payload) {
    await mockDelay()
    const currentUser = authMockRepository.requireSessionUser()
    const db = getDb()
    const email = normalizeEmail(payload.email)

    if (db.users.some((item) => normalizeEmail(item.email) === email)) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_EMAIL',
        message: 'User email must be unique',
        fieldErrors: { email: 'User email must be unique' },
      })
    }

    if (!Object.values(ROLES).includes(payload.role)) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_ROLE',
        message: 'Invalid role',
        fieldErrors: { role: 'Invalid role' },
      })
    }

    const user = {
      id: createId('user'),
      name: String(payload.name || '').trim(),
      email,
      role: payload.role,
      status: payload.status || USER_STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
    }

    db.users.unshift(user)
    return singleResponse(toPublicUser(user))
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const user = findUserOrThrow(id)
    const email = normalizeEmail(payload.email ?? user.email)

    if (
      db.users.some(
        (item) => item.id !== id && normalizeEmail(item.email) === email,
      )
    ) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_EMAIL',
        message: 'User email must be unique',
        fieldErrors: { email: 'User email must be unique' },
      })
    }

    Object.assign(user, {
      name: String(payload.name ?? user.name).trim(),
      email,
      role: payload.role ?? user.role,
      status: payload.status ?? user.status,
      updatedAt: new Date().toISOString(),
    })

    return singleResponse(toPublicUser(user))
  },

  async changeStatus(id, status) {
    await mockDelay()
    const currentUser = authMockRepository.requireSessionUser()
    const user = findUserOrThrow(id)

    if (
      currentUser.id === id &&
      currentUser.role === ROLES.SUPER_ADMIN &&
      status === USER_STATUS.INACTIVE
    ) {
      throw new ApiError({
        status: 400,
        code: 'CANNOT_DEACTIVATE_SELF',
        message: 'Current Super Admin cannot deactivate self',
      })
    }

    if (![USER_STATUS.ACTIVE, USER_STATUS.INACTIVE].includes(status)) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_STATUS',
        message: 'Invalid user status',
      })
    }

    user.status = status
    user.updatedAt = new Date().toISOString()
    return singleResponse(toPublicUser(user))
  },
}
