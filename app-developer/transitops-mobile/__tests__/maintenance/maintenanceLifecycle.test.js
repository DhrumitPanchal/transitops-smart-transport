import * as authService from '@/services/authService'
import * as maintenanceService from '@/services/maintenanceService'
import { resetDemoData, getDb } from '@/mocks/mockDatabase'
import tokenManager from '@/api/tokenManager'
import { MAINTENANCE_STATUS, VEHICLE_STATUS } from '@/constants/statuses'
import { MAINTENANCE_TYPES } from '@/constants/appConstants'

async function loginAsAdmin() {
  await authService.login({
    email: 'admin@transitops.com',
    password: 'Admin@123',
  })
}

describe('maintenanceLifecycle', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
    await loginAsAdmin()
  })

  it('creates maintenance and sets vehicle to IN_SHOP', async () => {
    const result = await maintenanceService.create({
      vehicleId: 'veh_2',
      maintenanceType: MAINTENANCE_TYPES.PREVENTIVE,
      description: 'Scheduled service and fluid change',
      startDate: '2026-07-12',
      expectedEndDate: '2026-07-15',
      cost: 8000,
      vendorName: 'City Garage',
      notes: 'Oil + filters',
      status: MAINTENANCE_STATUS.IN_PROGRESS,
    })

    expect(result.data.maintenance.status).toBe(MAINTENANCE_STATUS.IN_PROGRESS)
    expect(result.data.vehicle.status).toBe(VEHICLE_STATUS.IN_SHOP)
    expect(getDb().vehicles.find((item) => item.id === 'veh_2').status).toBe(
      VEHICLE_STATUS.IN_SHOP,
    )
  })

  it('completes maintenance and restores vehicle to AVAILABLE', async () => {
    const created = await maintenanceService.create({
      vehicleId: 'veh_2',
      maintenanceType: MAINTENANCE_TYPES.ROUTINE,
      description: 'Routine check',
      startDate: '2026-07-12',
      expectedEndDate: '2026-07-13',
      cost: 2500,
      vendorName: 'Depot Bay',
      status: MAINTENANCE_STATUS.OPEN,
    })

    const completed = await maintenanceService.complete(created.data.maintenance.id, {
      completionDate: '2026-07-13',
      finalCost: 2750,
      notes: 'All good',
    })

    expect(completed.data.maintenance.status).toBe(MAINTENANCE_STATUS.COMPLETED)
    expect(completed.data.maintenance.finalCost).toBe(2750)
    expect(completed.data.vehicle.status).toBe(VEHICLE_STATUS.AVAILABLE)
    expect(getDb().vehicles.find((item) => item.id === 'veh_2').status).toBe(
      VEHICLE_STATUS.AVAILABLE,
    )
  })

  it('rejects maintenance for ON_TRIP vehicles', async () => {
    await expect(
      maintenanceService.create({
        vehicleId: 'veh_1',
        maintenanceType: MAINTENANCE_TYPES.CORRECTIVE,
        description: 'Should fail',
        startDate: '2026-07-12',
        expectedEndDate: '2026-07-14',
        cost: 1000,
        vendorName: 'X',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VEHICLE_ON_TRIP',
    })
  })

  it('rejects maintenance for RETIRED vehicles', async () => {
    await expect(
      maintenanceService.create({
        vehicleId: 'veh_4',
        maintenanceType: MAINTENANCE_TYPES.INSPECTION,
        description: 'Should fail retired',
        startDate: '2026-07-12',
        expectedEndDate: '2026-07-14',
        cost: 500,
        vendorName: 'X',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VEHICLE_RETIRED',
    })
  })

  it('cancels active maintenance and frees the vehicle', async () => {
    const created = await maintenanceService.create({
      vehicleId: 'veh_2',
      maintenanceType: MAINTENANCE_TYPES.TYRE,
      description: 'Tyre replacement',
      startDate: '2026-07-12',
      expectedEndDate: '2026-07-14',
      cost: 6000,
      vendorName: 'TyreCo',
    })

    const cancelled = await maintenanceService.cancel(created.data.maintenance.id, {
      reason: 'Parts unavailable',
    })
    expect(cancelled.data.maintenance.status).toBe(MAINTENANCE_STATUS.CANCELLED)
    expect(cancelled.data.vehicle.status).toBe(VEHICLE_STATUS.AVAILABLE)
  })
})
