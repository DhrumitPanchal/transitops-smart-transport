import { ApiError } from '../../api/apiError'
import { ROLES } from '../../constants/roles'
import { USER_STATUS } from '../../constants/statuses'
import { mockDelay } from '../mockDelay'
import {
  getDb,
  syncCredentialEmail,
  toPublicUser,
  upsertCredential,
} from '../mockDatabase'
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

function assertNoPasswordLeak(record) {
  if (!record || typeof record !== 'object') return record
  const clone = { ...record }
  delete clone.password
  delete clone.confirmPassword
  delete clone.passwordHash
  return clone
}

function createdUserResponse(user) {
  return {
    success: true,
    message: 'User created successfully.',
    data: {
      user: assertNoPasswordLeak(toPublicUser(user)),
    },
  }
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
    const password = String(payload.password || '')

    if (!email || !password) {
      throw new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Required credentials are missing',
        fieldErrors: {
          ...(email ? {} : { email: 'Email is required' }),
          ...(password ? {} : { password: 'Password is required' }),
        },
      })
    }

    if (password.length < 8) {
      throw new ApiError({
        status: 400,
        code: 'PASSWORD_REQUIRED',
        message: 'Password must be at least 8 characters',
        fieldErrors: { password: 'Password must be at least 8 characters' },
      })
    }

    if (db.users.some((item) => normalizeEmail(item.email) === email)) {
      throw new ApiError({
        status: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'A user with this email already exists.',
        fieldErrors: { email: 'This email is already registered.' },
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

    const roleExists = db.roles.some((role) => role.key === payload.role)
    if (!roleExists) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_ROLE',
        message: 'Role does not exist',
        fieldErrors: { role: 'Role does not exist' },
      })
    }

    const status = payload.status || USER_STATUS.ACTIVE
    if (![USER_STATUS.ACTIVE, USER_STATUS.INACTIVE].includes(status)) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_STATUS',
        message: 'Invalid user status',
        fieldErrors: { status: 'Invalid user status' },
      })
    }

    const now = new Date().toISOString()
    const user = {
      id: createId('user'),
      name: String(payload.name || '').trim(),
      email,
      role: payload.role,
      status,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
    }

    // Shared credential store — never on the user profile / API response
    upsertCredential({
      userId: user.id,
      email,
      password,
    })
    db.users.unshift(user)

    return createdUserResponse(user)
  },

  async update(id, payload) {
    await mockDelay()
    const currentUser = authMockRepository.requireSessionUser()
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
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'A user with this email already exists.',
        fieldErrors: { email: 'This email is already registered.' },
      })
    }

    const nextStatus = payload.status ?? user.status
    if (
      currentUser.id === id &&
      currentUser.role === ROLES.SUPER_ADMIN &&
      nextStatus === USER_STATUS.INACTIVE
    ) {
      throw new ApiError({
        status: 400,
        code: 'CANNOT_DEACTIVATE_SELF',
        message: 'Current Super Admin cannot deactivate self',
        fieldErrors: { status: 'Current Super Admin cannot deactivate self' },
      })
    }

    Object.assign(user, {
      name: String(payload.name ?? user.name).trim(),
      email,
      role: payload.role ?? user.role,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    })

    syncCredentialEmail(user.id, email)

    return singleResponse(assertNoPasswordLeak(toPublicUser(user)))
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

    // Approving PENDING requires role assignment via approve()
    if (
      user.status === USER_STATUS.PENDING &&
      status === USER_STATUS.ACTIVE &&
      !user.role
    ) {
      throw new ApiError({
        status: 422,
        code: 'INVALID_ROLE',
        message: 'Select a valid role.',
        fieldErrors: { role: 'Select a valid role.' },
      })
    }

    user.status = status
    user.updatedAt = new Date().toISOString()
    return singleResponse(assertNoPasswordLeak(toPublicUser(user)))
  },

  async approve(id, payload = {}) {
    await mockDelay()
    const currentUser = authMockRepository.requireSessionUser()
    const db = getDb()
    const user = findUserOrThrow(id)

    if (String(currentUser.id) === String(user.id)) {
      throw new ApiError({
        status: 403,
        code: 'CANNOT_APPROVE_SELF',
        message: 'You cannot approve your own account.',
      })
    }

    if (user.status === USER_STATUS.ACTIVE && user.role) {
      throw new ApiError({
        status: 409,
        code: 'USER_ALREADY_ACTIVE',
        message: 'This user is already active.',
      })
    }

    if (user.status !== USER_STATUS.PENDING) {
      throw new ApiError({
        status: 409,
        code: 'USER_ALREADY_ACTIVE',
        message: 'This user is already active.',
      })
    }

    const role = payload.role
    if (!Object.values(ROLES).includes(role)) {
      throw new ApiError({
        status: 422,
        code: 'INVALID_ROLE',
        message: 'Select a valid role.',
        fieldErrors: { role: 'Select a valid role.' },
      })
    }

    const roleExists = db.roles.some((item) => item.key === role)
    if (!roleExists) {
      throw new ApiError({
        status: 422,
        code: 'INVALID_ROLE',
        message: 'Select a valid role.',
        fieldErrors: { role: 'Select a valid role.' },
      })
    }

    user.role = role
    user.status = USER_STATUS.ACTIVE
    user.updatedAt = new Date().toISOString()

    const safeUser = assertNoPasswordLeak(toPublicUser(user))

    return {
      success: true,
      message: 'User approved successfully.',
      data: {
        user: safeUser,
      },
    }
  },
}
