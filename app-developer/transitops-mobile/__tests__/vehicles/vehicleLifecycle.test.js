import * as authService from '@/services/authService'
import * as vehicleService from '@/services/vehicleService'
import { resetDemoData, getDb } from '@/mocks/mockDatabase'
import tokenManager from '@/api/tokenManager'
import { VEHICLE_STATUS } from '@/constants/statuses'
import { VEHICLE_TYPES } from '@/constants/appConstants'

async function loginAsAdmin() {
  await authService.login({
    email: 'admin@transitops.com',
    password: 'Admin@123',
  })
}

describe('vehicleLifecycle', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
    await loginAsAdmin()
  })

  it('creates a vehicle as AVAILABLE by default', async () => {
    const result = await vehicleService.create({
      registrationNumber: 'ka99zz9999',
      vehicleName: 'Night Runner',
      model: 'Volvo 9400',
      vehicleType: VEHICLE_TYPES.BUS,
      maxLoadCapacity: 9000,
      odometer: 1200,
      acquisitionCost: 4000000,
      region: 'Bengaluru',
    })

    expect(result.data.item.registrationNumber).toBe('KA99ZZ9999')
    expect(result.data.item.status).toBe(VEHICLE_STATUS.AVAILABLE)
  })

  it('edits vehicle fields', async () => {
    const updated = await vehicleService.update('veh_2', {
      vehicleName: 'Depot Hauler Plus',
      region: 'Mangaluru',
      maxLoadCapacity: 13000,
    })
    expect(updated.data.item.vehicleName).toBe('Depot Hauler Plus')
    expect(updated.data.item.region).toBe('Mangaluru')
    expect(updated.data.item.maxLoadCapacity).toBe(13000)
  })

  it('rejects duplicate registration numbers', async () => {
    await expect(
      vehicleService.create({
        registrationNumber: 'KA01AB1234',
        vehicleName: 'Clone Bus',
        model: 'Clone',
        vehicleType: VEHICLE_TYPES.BUS,
        maxLoadCapacity: 5000,
        odometer: 0,
        acquisitionCost: 1000,
        region: 'Bengaluru',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_REGISTRATION',
    })
  })

  it('retires an available vehicle', async () => {
    const retired = await vehicleService.retire('veh_2')
    expect(retired.data.item.status).toBe(VEHICLE_STATUS.RETIRED)
    expect(getDb().vehicles.find((item) => item.id === 'veh_2').status).toBe(
      VEHICLE_STATUS.RETIRED,
    )
  })

  it('does not retire a vehicle that is ON_TRIP', async () => {
    await expect(vehicleService.retire('veh_1')).rejects.toMatchObject({
      status: 409,
      code: 'VEHICLE_ON_TRIP',
    })
  })

  it('lists only AVAILABLE vehicles in getAvailable', async () => {
    const result = await vehicleService.getAvailable()
    const statuses = result.data.items.map((item) => item.status)
    expect(statuses.every((status) => status === VEHICLE_STATUS.AVAILABLE)).toBe(
      true,
    )
    expect(result.data.items.some((item) => item.id === 'veh_2')).toBe(true)
    expect(result.data.items.some((item) => item.id === 'veh_1')).toBe(false)
    expect(result.data.items.some((item) => item.id === 'veh_4')).toBe(false)
  })

  it('rejects manual ON_TRIP / IN_SHOP on create', async () => {
    await expect(
      vehicleService.create({
        registrationNumber: 'KA88XX8888',
        vehicleName: 'Bad Status',
        model: 'X',
        vehicleType: VEHICLE_TYPES.VAN,
        maxLoadCapacity: 1000,
        odometer: 0,
        acquisitionCost: 100,
        region: 'Bengaluru',
        status: VEHICLE_STATUS.ON_TRIP,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_STATUS',
    })
  })
})
