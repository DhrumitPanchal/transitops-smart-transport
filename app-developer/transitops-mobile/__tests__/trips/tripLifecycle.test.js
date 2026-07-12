import * as authService from '@/services/authService'
import * as tripService from '@/services/tripService'
import { resetDemoData, getDb } from '@/mocks/mockDatabase'
import tokenManager from '@/api/tokenManager'
import {
  DRIVER_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
} from '@/constants/statuses'

async function loginAsAdmin() {
  await authService.login({
    email: 'admin@transitops.com',
    password: 'Admin@123',
  })
}

describe('tripLifecycle', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
    await loginAsAdmin()
  })

  it('rejects create when cargo exceeds vehicle capacity', async () => {
    await expect(
      tripService.create({
        source: 'Depot A',
        destination: 'Depot B',
        vehicleId: 'veh_2',
        driverId: 'drv_2',
        cargoWeight: 999999,
        plannedDistance: 50,
        revenue: 1000,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'CARGO_EXCEEDS_CAPACITY',
    })
  })

  it('creates a draft trip within capacity', async () => {
    const result = await tripService.create({
      source: 'Hub North',
      destination: 'Hub South',
      vehicleId: 'veh_2',
      driverId: 'drv_2',
      cargoWeight: 4000,
      plannedDistance: 80,
      revenue: 9000,
    })
    expect(result.data.item.status).toBe(TRIP_STATUS.DRAFT)
    expect(result.data.item.cargoWeight).toBe(4000)
  })

  it('dispatches a draft trip and marks vehicle/driver ON_TRIP', async () => {
    const result = await tripService.dispatch('trip_3')
    expect(result.data.trip.status).toBe(TRIP_STATUS.DISPATCHED)
    expect(result.data.vehicle.status).toBe(VEHICLE_STATUS.ON_TRIP)
    expect(result.data.driver.status).toBe(DRIVER_STATUS.ON_TRIP)

    const db = getDb()
    expect(db.vehicles.find((item) => item.id === 'veh_2').status).toBe(
      VEHICLE_STATUS.ON_TRIP,
    )
    expect(db.drivers.find((item) => item.id === 'drv_2').status).toBe(
      DRIVER_STATUS.ON_TRIP,
    )
  })

  it('completes a dispatched trip and restores AVAILABLE statuses', async () => {
    await tripService.dispatch('trip_3')
    const completed = await tripService.complete('trip_3', {
      finalOdometer: 78250,
      fuelConsumed: 22,
      fuelCost: 2200,
      revenue: 15000,
    })

    expect(completed.data.trip.status).toBe(TRIP_STATUS.COMPLETED)
    expect(completed.data.vehicle.status).toBe(VEHICLE_STATUS.AVAILABLE)
    expect(completed.data.driver.status).toBe(DRIVER_STATUS.AVAILABLE)
    expect(completed.data.fuelLog).toMatchObject({
      vehicleId: 'veh_2',
      tripId: 'trip_3',
      liters: 22,
      cost: 2200,
    })
    expect(getDb().vehicles.find((item) => item.id === 'veh_2').odometer).toBe(
      78250,
    )
  })

  it('cancels a dispatched trip and frees resources', async () => {
    await tripService.dispatch('trip_3')
    const cancelled = await tripService.cancel('trip_3', {
      reason: 'Customer cancelled booking',
    })

    expect(cancelled.data.trip.status).toBe(TRIP_STATUS.CANCELLED)
    expect(cancelled.data.vehicle.status).toBe(VEHICLE_STATUS.AVAILABLE)
    expect(cancelled.data.driver.status).toBe(DRIVER_STATUS.AVAILABLE)
  })

  it('cancels a draft trip without changing vehicle/driver status', async () => {
    const beforeVehicle = getDb().vehicles.find((item) => item.id === 'veh_2')
      .status
    const beforeDriver = getDb().drivers.find((item) => item.id === 'drv_2')
      .status

    const cancelled = await tripService.cancel('trip_3', {
      reason: 'Planning change',
    })
    expect(cancelled.data.trip.status).toBe(TRIP_STATUS.CANCELLED)
    expect(getDb().vehicles.find((item) => item.id === 'veh_2').status).toBe(
      beforeVehicle,
    )
    expect(getDb().drivers.find((item) => item.id === 'drv_2').status).toBe(
      beforeDriver,
    )
  })

  it('rejects completing a non-dispatched trip', async () => {
    await expect(
      tripService.complete('trip_3', {
        finalOdometer: 79000,
        fuelConsumed: 10,
        fuelCost: 1000,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'TRIP_NOT_DISPATCHED',
    })
  })
})
