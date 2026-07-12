import { ApiError } from '../../api/apiError'
import { mockDelay } from '../mockDelay'
import { getDb, toPublicUser } from '../db'
import { normalizeEmail, singleResponse } from '../mockHelpers'
import { USER_STATUS } from '../../constants/statuses'
import { ROLE_LABELS, ROLE_LANDING_ROUTES } from '../../constants/roles'

/** In-memory credentials only — never attached to public user payloads. */
const AUTH_CREDENTIALS = [
  {
    email: 'admin@transitops.com',
    password: 'Admin@123',
  },
  {
    email: 'fleet@transitops.com',
    password: 'Fleet@123',
  },
  {
    email: 'dispatcher@transitops.com',
    password: 'Dispatcher@123',
  },
  {
    email: 'safety@transitops.com',
    password: 'Safety@123',
  },
  {
    email: 'finance@transitops.com',
    password: 'Finance@123',
  },
]

function findCredential(email, password) {
  const normalized = normalizeEmail(email)
  return AUTH_CREDENTIALS.find(
    (item) => item.email === normalized && item.password === password,
  )
}

export const authMockRepository = {
  registerCredential(email, password) {
    const normalized = normalizeEmail(email)
    const existing = AUTH_CREDENTIALS.find((item) => item.email === normalized)
    if (existing) {
      existing.password = String(password)
      return
    }
    AUTH_CREDENTIALS.push({
      email: normalized,
      password: String(password),
    })
  },

  async login({ email, password }) {
    await mockDelay()
    const db = getDb()
    const credential = findCredential(email, password)

    if (!credential) {
      throw new ApiError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      })
    }

    const user = db.users.find(
      (item) => normalizeEmail(item.email) === credential.email,
    )

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new ApiError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'This account is inactive',
      })
    }

    db.currentUserId = user.id
    return singleResponse(toPublicUser(user))
  },

  clearSession() {
    getDb().currentUserId = null
  },

  async logout() {
    await mockDelay()
    this.clearSession()
    return singleResponse({ success: true })
  },

  async getCurrentUser() {
    await mockDelay()
    const db = getDb()
    const user = db.users.find((item) => item.id === db.currentUserId)

    if (!user) {
      throw new ApiError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      })
    }

    if (user.status === USER_STATUS.INACTIVE) {
      this.clearSession()
      throw new ApiError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'This account is inactive',
      })
    }

    return singleResponse(toPublicUser(user))
  },

  getDemoAccounts() {
    const db = getDb()

    return AUTH_CREDENTIALS.filter((credential) =>
      db.users.some(
        (item) => normalizeEmail(item.email) === credential.email,
      ),
    ).map((credential) => {
      const user = db.users.find(
        (item) => normalizeEmail(item.email) === credential.email,
      )

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
      throw new ApiError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      })
    }

    if (user.status === USER_STATUS.INACTIVE) {
      this.clearSession()
      throw new ApiError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'This account is inactive',
      })
    }

    return user
  },
}
