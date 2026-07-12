import { mockDelay } from '../mockDelay'
import { ensureMockDbReady, getDb } from '../mockDatabase'
import { singleResponse } from '../mockHelpers'
import { authMockRepository } from './authMockRepository'
import {
  DRIVER_STATUS,
  MAINTENANCE_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'
import { EXPENSE_TYPE_LABELS } from '../../constants/appConstants'
import {
  isLicenseExpired,
  isLicenseExpiringSoon,
} from '../../utils/dateHelpers'

const LICENSE_EXPIRING_SOON_DAYS = 30

function monthKey(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function monthLabel(key) {
  if (!key) return '—'
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

function buildMonthlySeries(items, dateField, amountField, months = 6) {
  const now = new Date()
  const keys = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(date))
  }

  const totals = Object.fromEntries(keys.map((key) => [key, 0]))
  items.forEach((item) => {
    const key = monthKey(item[dateField])
    if (key && Object.prototype.hasOwnProperty.call(totals, key)) {
      totals[key] += Number(item[amountField] ?? 0)
    }
  })

  return keys.map((key) => ({
    month: key,
    label: monthLabel(key),
    value: Math.round(totals[key] * 100) / 100,
  }))
}

function buildDashboardSummary() {
  const db = getDb()

  const activeVehicles = db.vehicles.filter(
    (item) => item.status !== VEHICLE_STATUS.RETIRED,
  )
  const availableVehicles = db.vehicles.filter(
    (item) => item.status === VEHICLE_STATUS.AVAILABLE,
  )
  const vehiclesOnTrip = db.vehicles.filter(
    (item) => item.status === VEHICLE_STATUS.ON_TRIP,
  )
  const vehiclesInMaintenance = db.vehicles.filter(
    (item) => item.status === VEHICLE_STATUS.IN_SHOP,
  )

  const availableDrivers = db.drivers.filter(
    (item) => item.status === DRIVER_STATUS.AVAILABLE,
  )
  const driversOnDuty = db.drivers.filter(
    (item) => item.status === DRIVER_STATUS.ON_TRIP,
  )
  const suspendedDrivers = db.drivers.filter(
    (item) => item.status === DRIVER_STATUS.SUSPENDED,
  )

  const activeTrips = db.trips.filter(
    (item) => item.status === TRIP_STATUS.DISPATCHED,
  )
  const pendingTrips = db.trips.filter(
    (item) => item.status === TRIP_STATUS.DRAFT,
  )

  const openMaintenance = db.maintenance.filter((item) =>
    [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
      item.status,
    ),
  )

  const fuelCost = db.fuelLogs.reduce(
    (total, item) => total + Number(item.cost || 0),
    0,
  )
  const maintenanceCost = db.maintenance.reduce(
    (total, item) => total + Number(item.finalCost ?? item.cost ?? 0),
    0,
  )
  const expenseCost = db.expenses.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  )
  const totalOperationalCost = fuelCost + maintenanceCost + expenseCost

  const revenue = db.trips.reduce(
    (total, item) => total + Number(item.revenue || 0),
    0,
  )

  const acquisitionCost = activeVehicles.reduce(
    (total, item) => total + Number(item.acquisitionCost || 0),
    0,
  )
  const net = revenue - totalOperationalCost
  const vehicleRoi =
    acquisitionCost > 0
      ? Math.round((net / acquisitionCost) * 10000) / 100
      : 0

  const totalLiters = db.fuelLogs.reduce(
    (total, item) => total + Number(item.liters || 0),
    0,
  )
  const totalDistance = db.trips.reduce((total, item) => {
    if (item.finalOdometer != null && item.startOdometer != null) {
      return total + (Number(item.finalOdometer) - Number(item.startOdometer))
    }
    return total + Number(item.plannedDistance || 0)
  }, 0)
  const fuelEfficiency =
    totalLiters > 0
      ? Math.round((totalDistance / totalLiters) * 100) / 100
      : 0

  const fleetUtilization =
    activeVehicles.length > 0
      ? Math.round((vehiclesOnTrip.length / activeVehicles.length) * 10000) /
        100
      : 0

  const expiredLicences = db.drivers.filter((item) =>
    isLicenseExpired(item.licenseExpiryDate),
  )
  const expiringLicences = db.drivers.filter((item) =>
    isLicenseExpiringSoon(item.licenseExpiryDate, LICENSE_EXPIRING_SOON_DAYS),
  )

  const averageSafetyScore =
    db.drivers.length > 0
      ? Math.round(
          (db.drivers.reduce(
            (total, item) => total + Number(item.safetyScore || 0),
            0,
          ) /
            db.drivers.length) *
            10,
        ) / 10
      : 0

  const expenseBreakdownMap = {}
  db.expenses.forEach((item) => {
    const key = item.expenseType || 'OTHER'
    expenseBreakdownMap[key] =
      (expenseBreakdownMap[key] || 0) + Number(item.amount || 0)
  })

  const getVehicle = (id) => db.vehicles.find((item) => item.id === id) || null
  const getDriver = (id) => db.drivers.find((item) => item.id === id) || null

  const recentTrips = [...db.trips]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((trip) => {
      const vehicle = getVehicle(trip.vehicleId)
      const driver = getDriver(trip.driverId)
      return {
        ...trip,
        vehicleRegistration: vehicle?.registrationNumber || null,
        driverName: driver?.name || null,
      }
    })

  const vehiclesInMaintenanceList = openMaintenance.map((record) => {
    const vehicle = getVehicle(record.vehicleId)
    return {
      ...record,
      vehicleRegistration: vehicle?.registrationNumber || null,
      vehicleName: vehicle?.vehicleName || null,
    }
  })

  return {
    kpis: {
      activeVehicles: activeVehicles.length,
      availableVehicles: availableVehicles.length,
      vehiclesOnTrip: vehiclesOnTrip.length,
      vehiclesInMaintenance: vehiclesInMaintenance.length,
      activeTrips: activeTrips.length,
      pendingTrips: pendingTrips.length,
      driversOnDuty: driversOnDuty.length,
      availableDrivers: availableDrivers.length,
      fleetUtilization,
      totalOperationalCost,
      fuelCost,
      maintenanceCost,
      expenses: expenseCost,
      revenue,
      vehicleRoi,
      fuelEfficiency,
      expiredLicences: expiredLicences.length,
      expiringLicences: expiringLicences.length,
      suspendedDrivers: suspendedDrivers.length,
      averageSafetyScore,
    },
    charts: {
      vehicleStatusDistribution: [
        { status: VEHICLE_STATUS.AVAILABLE, value: availableVehicles.length },
        { status: VEHICLE_STATUS.ON_TRIP, value: vehiclesOnTrip.length },
        { status: VEHICLE_STATUS.IN_SHOP, value: vehiclesInMaintenance.length },
        {
          status: VEHICLE_STATUS.RETIRED,
          value: db.vehicles.filter(
            (item) => item.status === VEHICLE_STATUS.RETIRED,
          ).length,
        },
      ],
      tripStatusDistribution: [
        {
          status: TRIP_STATUS.DRAFT,
          value: db.trips.filter((item) => item.status === TRIP_STATUS.DRAFT)
            .length,
        },
        {
          status: TRIP_STATUS.DISPATCHED,
          value: activeTrips.length,
        },
        {
          status: TRIP_STATUS.COMPLETED,
          value: db.trips.filter(
            (item) => item.status === TRIP_STATUS.COMPLETED,
          ).length,
        },
        {
          status: TRIP_STATUS.CANCELLED,
          value: db.trips.filter(
            (item) => item.status === TRIP_STATUS.CANCELLED,
          ).length,
        },
      ],
      monthlyFuelCost: buildMonthlySeries(db.fuelLogs, 'fuelDate', 'cost'),
      monthlyMaintenanceCost: buildMonthlySeries(
        db.maintenance,
        'startDate',
        'cost',
      ),
      expenseBreakdown: Object.entries(expenseBreakdownMap).map(
        ([type, value]) => ({
          type,
          label: EXPENSE_TYPE_LABELS[type] || type,
          value: Math.round(value * 100) / 100,
        }),
      ),
    },
    sections: {
      recentTrips,
      expiringLicences: expiringLicences.map((driver) => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseExpiryDate: driver.licenseExpiryDate,
        safetyScore: driver.safetyScore,
        status: driver.status,
      })),
      expiredLicences: expiredLicences.map((driver) => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseExpiryDate: driver.licenseExpiryDate,
        safetyScore: driver.safetyScore,
        status: driver.status,
      })),
      vehiclesInMaintenance: vehiclesInMaintenanceList,
      suspendedDrivers: suspendedDrivers.map((driver) => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        safetyScore: driver.safetyScore,
        status: driver.status,
      })),
    },
    generatedAt: new Date().toISOString(),
  }
}

export const dashboardMockRepository = {
  async getSummary() {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(buildDashboardSummary())
  },
}
