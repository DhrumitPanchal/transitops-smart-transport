import { describe, expect, it } from 'vitest'
import {
  fromApi,
  resolveRoleCode,
  toApiMutation,
  toApiQuery,
} from './userMapper'
import { fromApiSession } from './authMapper'

describe('userMapper', () => {
  it('maps first/last name and role object into frontend user shape', () => {
    const user = fromApi({
      id: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      status: 'PENDING',
      role: null,
      permissions: [],
    })

    expect(user.name).toBe('Ada Lovelace')
    expect(user.role).toBeNull()
    expect(user.status).toBe('PENDING')
  })

  it('resolves role codes from backend role objects', () => {
    expect(
      resolveRoleCode({ id: 'r1', code: 'SUPER_ADMIN', name: 'Super Admin' }),
    ).toBe('SUPER_ADMIN')
    expect(resolveRoleCode('Fleet Manager')).toBe('FLEET_MANAGER')
  })

  it('keeps PENDING status in list queries', () => {
    expect(toApiQuery({ status: 'PENDING', pageSize: 20 }).status).toBe(
      'PENDING',
    )
    expect(toApiQuery({ pageSize: 20 }).limit).toBe(20)
  })

  it('splits name for create/approve mutations', () => {
    expect(toApiMutation({ name: 'New User', role: 'DISPATCHER' })).toEqual(
      expect.objectContaining({
        firstName: 'New',
        lastName: 'User',
        role: 'DISPATCHER',
      }),
    )
  })
})

describe('authMapper', () => {
  it('unwraps login/register session envelope', () => {
    const mapped = fromApiSession({
      success: true,
      message: 'ok',
      data: {
        user: {
          id: 'u1',
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@transitops.com',
          status: 'ACTIVE',
          role: { id: 'r1', code: 'SUPER_ADMIN', name: 'Super Admin' },
          permissions: ['users.view'],
        },
      },
    })

    expect(mapped.data.user.name).toBe('Super Admin')
    expect(mapped.data.user.role).toBe('SUPER_ADMIN')
    expect(mapped.data.user.permissions).toEqual(['users.view'])
  })
})
