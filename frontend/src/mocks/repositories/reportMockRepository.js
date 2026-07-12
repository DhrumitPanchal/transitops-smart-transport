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

function buildSummary() {
  const db = getDb()

  return {
    vehicles: {
      total: db.vehicles.length,
      available: db.vehicles.filter(
        (item) => item.status === VEHICLE_STATUS.AVAILABLE,
      ).length,
      onTrip: db.vehicles.filter((item) => item.status === VEHICLE_STATUS.ON_TRIP)
        .length,
      inShop: db.vehicles.filter((item) => item.status === VEHICLE_STATUS.IN_SHOP)
        .length,
      retired: db.vehicles.filter(
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
      total: db.trips.length,
      draft: db.trips.filter((item) => item.status === TRIP_STATUS.DRAFT).length,
      dispatched: db.trips.filter(
        (item) => item.status === TRIP_STATUS.DISPATCHED,
      ).length,
      completed: db.trips.filter((item) => item.status === TRIP_STATUS.COMPLETED)
        .length,
      cancelled: db.trips.filter((item) => item.status === TRIP_STATUS.CANCELLED)
        .length,
    },
    maintenance: {
      open: db.maintenance.filter((item) =>
        [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
          item.status,
        ),
      ).length,
      completed: db.maintenance.filter(
        (item) => item.status === MAINTENANCE_STATUS.COMPLETED,
      ).length,
    },
    costs: {
      fuel: db.fuelLogs.reduce((total, item) => total + Number(item.cost || 0), 0),
      expenses: db.expenses.reduce(
        (total, item) => total + Number(item.amount || 0),
        0,
      ),
      maintenance: db.maintenance.reduce(
        (total, item) => total + Number(item.finalCost ?? item.cost ?? 0),
        0,
      ),
    },
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
  async getSummary() {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(buildSummary())
  },

  async exportCsv() {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const summary = buildSummary()

    const csv = [
      'Section,Metric,Value',
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
      toCsv(db.trips, [
        { key: 'id', header: 'Trip ID' },
        { key: 'source', header: 'Source' },
        { key: 'destination', header: 'Destination' },
        { key: 'status', header: 'Status' },
        { key: 'revenue', header: 'Revenue' },
      ]),
    ].join('\n')

    return singleResponse({
      fileName: `transitops-report-${Date.now()}.csv`,
      contentType: 'text/csv',
      content: csv,
      generatedAt: summary.generatedAt,
    })
  },
}
