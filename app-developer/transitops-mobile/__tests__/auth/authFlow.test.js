import * as authService from '@/services/authService'
import * as userService from '@/services/userService'
import { resetDemoData, getDb, toPublicUser } from '@/mocks/mockDatabase'
import tokenManager from '@/api/tokenManager'
import { ROLES } from '@/constants/roles'
import { USER_STATUS } from '@/constants/statuses'
import { ROUTES } from '@/constants/routes'
import { getRoleLandingRoute } from '@/utils/helpers'

async function loginAsAdmin() {
  return authService.login({
    email: 'admin@transitops.com',
    password: 'Admin@123',
  })
}

describe('authFlow', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
  })

  it('registers a pending user with empty permissions', async () => {
    const session = await authService.register({
      name: 'New Operator',
      email: 'new.ops@example.com',
      password: 'Secret1',
    })

    const user = session.data.user
    expect(user.status).toBe(USER_STATUS.PENDING)
    expect(user.role).toBeNull()
    expect(user.permissions).toEqual([])
    expect(session.data.accessToken).toMatch(/^mock_access_/)
    expect(getDb().currentUserId).toBe(user.id)
  })

  it('rejects duplicate registration email', async () => {
    await expect(
      authService.register({
        name: 'Duplicate',
        email: 'admin@transitops.com',
        password: 'Secret1',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_ALREADY_EXISTS',
    })
  })

  it('pending user can refresh session and still has no module permissions', async () => {
    const registered = await authService.register({
      name: 'Pending User',
      email: 'pending.user@example.com',
      password: 'Secret1',
    })

    const me = await authService.getCurrentUser()
    expect(me.data.user.status).toBe(USER_STATUS.PENDING)
    expect(me.data.user.permissions).toEqual([])
    expect(me.data.user.id).toBe(registered.data.user.id)

    // Pending users land on dashboard but without module permissions
    expect(getRoleLandingRoute(null)).toBe(ROUTES.DASHBOARD)
    expect(toPublicUser(getDb().users.find((u) => u.id === me.data.user.id)).permissions).toEqual(
      [],
    )
  })

  it('logs in an active seed account and stores tokens', async () => {
    const session = await loginAsAdmin()
    expect(session.data.user.status).toBe(USER_STATUS.ACTIVE)
    expect(session.data.user.role).toBe(ROLES.SUPER_ADMIN)
    expect(session.data.user.permissions.length).toBeGreaterThan(0)
    expect(await tokenManager.hasTokens()).toBe(true)
    expect(await tokenManager.getAccessToken()).toBe(session.data.accessToken)
  })

  it('rejects inactive account login', async () => {
    const db = getDb()
    const fleet = db.users.find((user) => user.email === 'fleet@transitops.com')
    fleet.status = USER_STATUS.INACTIVE

    await expect(
      authService.login({
        email: 'fleet@transitops.com',
        password: 'Fleet@123',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'USER_INACTIVE',
    })
  })

  it('rejects invalid credentials', async () => {
    await expect(
      authService.login({
        email: 'admin@transitops.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('logs out and clears session plus tokens', async () => {
    await loginAsAdmin()
    expect(getDb().currentUserId).toBe('user_1')

    const result = await authService.logout()
    expect(result.success).toBe(true)
    expect(getDb().currentUserId).toBeNull()
    expect(await tokenManager.hasTokens()).toBe(false)
  })

  it('approves a pending user who can then login as active', async () => {
    const registered = await authService.register({
      name: 'Approve Me',
      email: 'approve.me@example.com',
      password: 'Secret1',
    })
    const pendingId = registered.data.user.id

    await authService.logout()
    await loginAsAdmin()

    const approved = await userService.approve(pendingId, {
      role: ROLES.DISPATCHER,
    })
    expect(approved.data.user.status).toBe(USER_STATUS.ACTIVE)
    expect(approved.data.user.role).toBe(ROLES.DISPATCHER)
    expect(approved.data.user.permissions.length).toBeGreaterThan(0)

    await authService.logout()
    const session = await authService.login({
      email: 'approve.me@example.com',
      password: 'Secret1',
    })
    expect(session.data.user.status).toBe(USER_STATUS.ACTIVE)
    expect(session.data.user.role).toBe(ROLES.DISPATCHER)
  })

  it('keeps password after approval', async () => {
    const registered = await authService.register({
      name: 'Keep Password',
      email: 'keep.pass@example.com',
      password: 'KeepPass1',
    })

    await authService.logout()
    await loginAsAdmin()
    await userService.approve(registered.data.user.id, {
      role: ROLES.FLEET_MANAGER,
    })
    await authService.logout()

    const session = await authService.login({
      email: 'keep.pass@example.com',
      password: 'KeepPass1',
    })
    expect(session.data.user.role).toBe(ROLES.FLEET_MANAGER)
  })
})
