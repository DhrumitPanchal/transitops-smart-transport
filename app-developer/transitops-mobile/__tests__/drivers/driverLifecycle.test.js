import * as authService from '@/services/authService'
import * as driverService from '@/services/driverService'
import { resetDemoData, getDb } from '@/mocks/mockDatabase'
import tokenManager from '@/api/tokenManager'
import { DRIVER_STATUS } from '@/constants/statuses'
import { LICENCE_CATEGORIES } from '@/constants/appConstants'

async function loginAsAdmin() {
  await authService.login({
    email: 'admin@transitops.com',
    password: 'Admin@123',
  })
}

describe('driverLifecycle', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
    await loginAsAdmin()
  })

  it('creates an available driver', async () => {
    const result = await driverService.create({
      name: 'Meera Joshi',
      licenseNumber: 'ka2099001',
      licenseCategory: LICENCE_CATEGORIES.HMV,
      licenseExpiryDate: '2028-12-01',
      contactNumber: '+91 90000 11111',
      safetyScore: 90,
    })

    expect(result.data.item.licenseNumber).toBe('KA2099001')
    expect(result.data.item.status).toBe(DRIVER_STATUS.AVAILABLE)
  })

  it('rejects creating AVAILABLE driver with expired licence', async () => {
    await expect(
      driverService.create({
        name: 'Expired Driver',
        licenseNumber: 'KAEXPIRED1',
        licenseCategory: LICENCE_CATEGORIES.LMV,
        licenseExpiryDate: '2020-01-01',
        contactNumber: '+91 90000 22222',
        safetyScore: 70,
        status: DRIVER_STATUS.AVAILABLE,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'LICENSE_EXPIRED',
    })
  })

  it('suspends an available driver', async () => {
    const result = await driverService.suspend('drv_2')
    expect(result.data.item.status).toBe(DRIVER_STATUS.SUSPENDED)
    expect(getDb().drivers.find((item) => item.id === 'drv_2').status).toBe(
      DRIVER_STATUS.SUSPENDED,
    )
  })

  it('does not suspend a driver who is ON_TRIP', async () => {
    await expect(driverService.suspend('drv_1')).rejects.toMatchObject({
      status: 409,
      code: 'DRIVER_ON_TRIP',
    })
  })

  it('lists only AVAILABLE drivers with valid licences', async () => {
    const result = await driverService.getAvailable()
    expect(result.data.items.every((item) => item.status === DRIVER_STATUS.AVAILABLE)).toBe(
      true,
    )
    expect(result.data.items.some((item) => item.id === 'drv_2')).toBe(true)
    // Expired licence seed driver must never appear
    expect(result.data.items.some((item) => item.id === 'drv_3')).toBe(false)
    expect(result.data.items.some((item) => item.id === 'drv_4')).toBe(false)
    expect(result.data.items.some((item) => item.id === 'drv_1')).toBe(false)
  })

  it('rejects changing expired driver to AVAILABLE', async () => {
    await expect(
      driverService.changeStatus('drv_3', DRIVER_STATUS.AVAILABLE),
    ).rejects.toMatchObject({
      status: 400,
      code: 'LICENSE_EXPIRED',
    })
  })

  it('rejects duplicate licence numbers', async () => {
    await expect(
      driverService.create({
        name: 'Clone',
        licenseNumber: 'KA2020001',
        licenseCategory: LICENCE_CATEGORIES.HPMV,
        licenseExpiryDate: '2029-01-01',
        contactNumber: '+91 90000 33333',
        safetyScore: 80,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_LICENSE',
    })
  })
})
