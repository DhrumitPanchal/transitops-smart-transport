import { mockDelay } from '../mockDelay'
import { getDb } from '../db'
import { singleResponse } from '../mockHelpers'
import { authMockRepository } from './authMockRepository'
import {
  DRIVER_STATUS,
  MAINTENANCE_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'

export const dashboardMockRepository = {
  async getSummary() {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()

    const summary = {
      totalVehicles: db.vehicles.length,
      availableVehicles: db.vehicles.filter(
        (item) => item.status === VEHICLE_STATUS.AVAILABLE,
      ).length,
      vehiclesOnTrip: db.vehicles.filter(
        (item) => item.status === VEHICLE_STATUS.ON_TRIP,
      ).length,
      vehiclesInShop: db.vehicles.filter(
        (item) => item.status === VEHICLE_STATUS.IN_SHOP,
      ).length,
      totalDrivers: db.drivers.length,
      availableDrivers: db.drivers.filter(
        (item) => item.status === DRIVER_STATUS.AVAILABLE,
      ).length,
      tripsToday: db.trips.filter((item) =>
        [TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED, TRIP_STATUS.COMPLETED].includes(
          item.status,
        ),
      ).length,
      activeTrips: db.trips.filter((item) => item.status === TRIP_STATUS.DISPATCHED)
        .length,
      openMaintenance: db.maintenance.filter((item) =>
        [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
          item.status,
        ),
      ).length,
      fuelCostThisMonth: db.fuelLogs.reduce(
        (total, item) => total + Number(item.cost || 0),
        0,
      ),
      expensesThisMonth: db.expenses.reduce(
        (total, item) => total + Number(item.amount || 0),
        0,
      ),
    }

    return singleResponse(summary)
  },
}
