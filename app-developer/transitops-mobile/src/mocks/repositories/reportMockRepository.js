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
import { parseDateValue } from '../../utils/dateHelpers'

function inDateRange(dateValue, dateFrom, dateTo) {
  const start = parseDateValue(dateValue)
  if (!start) return true

  if (dateFrom) {
    const from = parseDateValue(dateFrom)
    if (from && start < from) return false
  }

  if (dateTo) {
    const to = parseDateValue(dateTo)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      if (start > end) return false
    }
  }

  return true
}

function filterVehicles(vehicles, filters = {}) {
  let items = [...vehicles]

  if (filters.vehicleId) {
    items = items.filter((item) => item.id === filters.vehicleId)
  }

  if (filters.vehicleType) {
    items = items.filter((item) => item.vehicleType === filters.vehicleType)
  }

  if (filters.region) {
    const region = String(filters.region).trim().toLowerCase()
    items = items.filter(
      (item) => String(item.region || '').toLowerCase() === region,
    )
  }

  return items
}

function buildSummary(filters = {}) {
  const db = getDb()
  const vehicles = filterVehicles(db.vehicles, filters)
  const vehicleIds = new Set(vehicles.map((item) => item.id))

  const trips = db.trips.filter((trip) => {
    if (vehicleIds.size && !vehicleIds.has(trip.vehicleId)) return false
    if (filters.dateFrom || filters.dateTo) {
      return inDateRange(trip.createdAt, filters.dateFrom, filters.dateTo)
    }
    return true
  })

  const fuelLogs = db.fuelLogs.filter((item) => {
    if (vehicleIds.size && !vehicleIds.has(item.vehicleId)) return false
    if (filters.dateFrom || filters.dateTo) {
      return inDateRange(item.fuelDate, filters.dateFrom, filters.dateTo)
    }
    return true
  })

  const maintenance = db.maintenance.filter((item) => {
    if (vehicleIds.size && !vehicleIds.has(item.vehicleId)) return false
    if (filters.dateFrom || filters.dateTo) {
      return inDateRange(item.startDate, filters.dateFrom, filters.dateTo)
    }
    return true
  })

  const expenses = db.expenses.filter((item) => {
    if (
      vehicleIds.size &&
      item.vehicleId &&
      !vehicleIds.has(item.vehicleId)
    ) {
      return false
    }
    if (filters.dateFrom || filters.dateTo) {
      return inDateRange(item.expenseDate, filters.dateFrom, filters.dateTo)
    }
    return true
  })

  const activeVehicles = vehicles.filter(
    (item) => item.status !== VEHICLE_STATUS.RETIRED,
  )
  const onTrip = vehicles.filter(
    (item) => item.status === VEHICLE_STATUS.ON_TRIP,
  ).length

  const fuelCost = fuelLogs.reduce(
    (total, item) => total + Number(item.cost || 0),
    0,
  )
  const maintenanceCost = maintenance.reduce(
    (total, item) => total + Number(item.finalCost ?? item.cost ?? 0),
    0,
  )
  const otherExpenses = expenses.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  )
  const operationalCost = fuelCost + maintenanceCost + otherExpenses
  const revenue = trips.reduce(
    (total, item) => total + Number(item.revenue || 0),
    0,
  )

  const acquisitionCost = activeVehicles.reduce(
    (total, item) => total + Number(item.acquisitionCost || 0),
    0,
  )
  const net = revenue - operationalCost
  const vehicleRoi =
    acquisitionCost > 0
      ? Math.round((net / acquisitionCost) * 10000) / 100
      : 0

  const totalLiters = fuelLogs.reduce(
    (total, item) => total + Number(item.liters || 0),
    0,
  )
  const totalDistance = trips.reduce((total, item) => {
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
      ? Math.round((onTrip / activeVehicles.length) * 10000) / 100
      : 0

  return {
    metrics: {
      fuelEfficiency,
      fleetUtilization,
      fuelCost,
      maintenanceCost,
      otherExpenses,
      operationalCost,
      revenue,
      vehicleRoi,
    },
    vehicles: {
      total: vehicles.length,
      available: vehicles.filter(
        (item) => item.status === VEHICLE_STATUS.AVAILABLE,
      ).length,
      onTrip,
      inShop: vehicles.filter((item) => item.status === VEHICLE_STATUS.IN_SHOP)
        .length,
      retired: vehicles.filter(
        (item) => item.status === VEHICLE_STATUS.RETIRED,
      ).length,
    },
    drivers: {
      total: db.drivers.length,
      available: db.drivers.filter(
        (item) => item.status === DRIVER_STATUS.AVAILABLE,
      ).length,
      onTrip: db.drivers.filter((item) => item.status === DRIVER_STATUS.ON_TRIP)
        .length,
      offDuty: db.drivers.filter(
        (item) => item.status === DRIVER_STATUS.OFF_DUTY,
      ).length,
      suspended: db.drivers.filter(
        (item) => item.status === DRIVER_STATUS.SUSPENDED,
      ).length,
    },
    trips: {
      total: trips.length,
      draft: trips.filter((item) => item.status === TRIP_STATUS.DRAFT).length,
      dispatched: trips.filter(
        (item) => item.status === TRIP_STATUS.DISPATCHED,
      ).length,
      completed: trips.filter((item) => item.status === TRIP_STATUS.COMPLETED)
        .length,
      cancelled: trips.filter((item) => item.status === TRIP_STATUS.CANCELLED)
        .length,
    },
    maintenance: {
      open: maintenance.filter((item) =>
        [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
          item.status,
        ),
      ).length,
      completed: maintenance.filter(
        (item) => item.status === MAINTENANCE_STATUS.COMPLETED,
      ).length,
    },
    costs: {
      fuel: fuelCost,
      expenses: otherExpenses,
      maintenance: maintenanceCost,
    },
    filters,
    generatedAt: new Date().toISOString(),
  }
}

function toCsv(rows, columns) {
  const header = columns.map((column) => column.header).join(',')
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const value = row[column.key]
        const text = value == null ? '' : String(value)
        return `"${text.replace(/"/g, '""')}"`
      })
      .join(','),
  )
  return [header, ...lines].join('\n')
}

export const reportMockRepository = {
  async getSummary(params = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(buildSummary(params))
  },

  async exportCsv(params = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const summary = buildSummary(params)
    const vehicles = filterVehicles(db.vehicles, params)
    const vehicleIds = new Set(vehicles.map((item) => item.id))
    const trips = db.trips.filter(
      (trip) => !vehicleIds.size || vehicleIds.has(trip.vehicleId),
    )

    const csv = [
      'Section,Metric,Value',
      `Metrics,Fuel Efficiency (km/L),${summary.metrics.fuelEfficiency}`,
      `Metrics,Fleet Utilization (%),${summary.metrics.fleetUtilization}`,
      `Metrics,Fuel Cost,${summary.metrics.fuelCost}`,
      `Metrics,Maintenance Cost,${summary.metrics.maintenanceCost}`,
      `Metrics,Other Expenses,${summary.metrics.otherExpenses}`,
      `Metrics,Operational Cost,${summary.metrics.operationalCost}`,
      `Metrics,Revenue,${summary.metrics.revenue}`,
      `Metrics,Vehicle ROI (%),${summary.metrics.vehicleRoi}`,
      `Vehicles,Total,${summary.vehicles.total}`,
      `Vehicles,Available,${summary.vehicles.available}`,
      `Vehicles,On Trip,${summary.vehicles.onTrip}`,
      `Drivers,Total,${summary.drivers.total}`,
      `Drivers,Available,${summary.drivers.available}`,
      `Trips,Completed,${summary.trips.completed}`,
      `Costs,Fuel,${summary.costs.fuel}`,
      `Costs,Expenses,${summary.costs.expenses}`,
      `Costs,Maintenance,${summary.costs.maintenance}`,
      '',
      toCsv(trips, [
        { key: 'id', header: 'Trip ID' },
        { key: 'tripNumber', header: 'Trip Number' },
        { key: 'source', header: 'Source' },
        { key: 'destination', header: 'Destination' },
        { key: 'status', header: 'Status' },
        { key: 'revenue', header: 'Revenue' },
      ]),
    ].join('\n')

    return singleResponse({
      fileName: `transitops-report-${Date.now()}.csv`,
      contentType: 'text/csv;charset=utf-8',
      content: csv,
      generatedAt: summary.generatedAt,
    })
  },
}
