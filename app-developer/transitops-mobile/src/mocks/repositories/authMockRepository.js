import { mockDelay } from '../mockDelay'
import {
  ensureMockDbReady,
  findCredentialByEmail,
  getDb,
  persistDb,
  toPublicUser,
  upsertCredential,
} from '../mockDatabase'
import {
  createId,
  normalizeEmail,
  throwMockError,
} from '../mockHelpers'
import { USER_STATUS } from '../../constants/statuses'
import { ROLE_LABELS, ROLE_LANDING_ROUTES } from '../../constants/roles'

function createMockTokens(userId) {
  const stamp = Date.now()
  return {
    accessToken: `mock_access_${userId}_${stamp}`,
    refreshToken: `mock_refresh_${userId}_${stamp}`,
  }
}

function sessionResponse(user, message) {
  const publicUser = toPublicUser(user)
  const tokens = createMockTokens(user.id)
  return {
    success: true,
    message: message || 'OK',
    data: {
      item: publicUser,
      user: publicUser,
      ...tokens,
    },
  }
}

export const authMockRepository = {
  registerCredential(userId, email, password) {
    upsertCredential({ userId, email, password })
  },

  async register(payload = {}) {
    await ensureMockDbReady()
    await mockDelay()
    const db = getDb()
    const name = String(payload.name || '').trim()
    const email = normalizeEmail(payload.email)
    const password = String(payload.password || '')

    if (!name || name.length < 2) {
      throwMockError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Name is required',
        fieldErrors: { name: 'Name is required' },
      })
    }

    if (!email || !password) {
      throwMockError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Required credentials are missing',
        fieldErrors: {
          ...(email ? {} : { email: 'Email is required' }),
          ...(password ? {} : { password: 'Password is required' }),
        },
      })
    }

    if (password.length < 6) {
      throwMockError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters',
        fieldErrors: { password: 'Password must be at least 6 characters' },
      })
    }

    if (db.users.some((item) => normalizeEmail(item.email) === email)) {
      throwMockError({
        status: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists.',
        fieldErrors: { email: 'This email is already registered.' },
      })
    }

    const now = new Date().toISOString()
    const user = {
      id: createId('user'),
      name,
      email,
      role: null,
      status: USER_STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
    }

    upsertCredential({
      userId: user.id,
      email,
      password,
    })
    db.users.unshift(user)
    db.currentUserId = user.id
    await persistDb()

    return sessionResponse(
      user,
      'Registration successful. Your account is waiting for administrator approval.',
    )
  },

  async login({ email, password } = {}) {
    await ensureMockDbReady()
    await mockDelay()
    const db = getDb()

    if (!email || !password) {
      throwMockError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      })
    }

    const credential = findCredentialByEmail(email)
    const normalizedPassword = String(password)

    if (!credential || credential.password !== normalizedPassword) {
      throwMockError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      })
    }

    const user = db.users.find((item) => item.id === credential.userId)

    if (!user) {
      throwMockError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      })
    }

    if (user.status === USER_STATUS.INACTIVE) {
      throwMockError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'Your account is inactive. Contact the administrator.',
      })
    }

    if (
      user.status === USER_STATUS.ACTIVE &&
      user.role &&
      !db.roles.some((role) => role.key === user.role)
    ) {
      throwMockError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      })
    }

    db.currentUserId = user.id
    await persistDb()
    return sessionResponse(user, 'Login successful.')
  },

  clearSession() {
    getDb().currentUserId = null
  },

  async logout() {
    await ensureMockDbReady()
    await mockDelay()
    this.clearSession()
    await persistDb()
    return {
      success: true,
      message: 'Logged out successfully.',
      data: { item: { success: true } },
    }
  },

  async getCurrentUser() {
    await ensureMockDbReady()
    await mockDelay()
    const db = getDb()
    const user = db.users.find((item) => item.id === db.currentUserId)

    if (!user) {
      throwMockError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      })
    }

    if (user.status === USER_STATUS.INACTIVE) {
      this.clearSession()
      await persistDb()
      throwMockError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'Your account is inactive. Contact the administrator.',
      })
    }

    return sessionResponse(user)
  },

  async refreshSession() {
    await ensureMockDbReady()
    await mockDelay()
    const db = getDb()
    const user = db.users.find((item) => item.id === db.currentUserId)

    if (!user) {
      throwMockError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      })
    }

    if (user.status === USER_STATUS.INACTIVE) {
      this.clearSession()
      await persistDb()
      throwMockError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'Your account is inactive. Contact the administrator.',
      })
    }

    return sessionResponse(user, 'Session refreshed.')
  },

  getDemoAccounts() {
    const db = getDb()

    return db.credentials
      .filter((credential) => {
        const user = db.users.find((item) => item.id === credential.userId)
        return user && user.status === USER_STATUS.ACTIVE && user.role
      })
      .map((credential) => {
        const user = db.users.find((item) => item.id === credential.userId)

        return {
          email: credential.email,
          password: credential.password,
          name: user?.name || credential.email,
          role: user?.role,
          roleLabel: ROLE_LABELS[user?.role] || user?.role,
          landingRoute: ROLE_LANDING_ROUTES[user?.role],
        }
      })
  },

  requireSessionUser() {
    const db = getDb()
    const user = db.users.find((item) => item.id === db.currentUserId)

    if (!user) {
      throwMockError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      })
    }

    if (user.status === USER_STATUS.INACTIVE) {
      this.clearSession()
      throwMockError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'Your account is inactive. Contact the administrator.',
      })
    }

    return user
  },
}
