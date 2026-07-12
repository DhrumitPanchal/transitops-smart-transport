import { ApiError } from '../../api/apiError'
import { parseDateValue } from '../../utils/dateHelpers'
import { mockDelay } from '../mockDelay'
import { getDb } from '../db'
import {
  applySearch,
  applySort,
  createId,
  paginateItems,
  singleResponse,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findFuelOrThrow(id) {
  const record = getDb().fuelLogs.find((item) => item.id === id)
  if (!record) {
    throw new ApiError({
      status: 404,
      code: 'FUEL_NOT_FOUND',
      message: 'Fuel log not found',
    })
  }
  return record
}

function getVehicle(vehicleId) {
  return getDb().vehicles.find((item) => item.id === vehicleId) || null
}

function getTrip(tripId) {
  if (!tripId) return null
  return getDb().trips.find((item) => item.id === tripId) || null
}

function costPerLitre(liters, cost) {
  const litres = Number(liters)
  const total = Number(cost)
  if (!Number.isFinite(litres) || litres <= 0) return null
  if (!Number.isFinite(total)) return null
  return Math.round((total / litres) * 100) / 100
}

function enrichFuelLog(record) {
  const vehicle = getVehicle(record.vehicleId)
  const trip = getTrip(record.tripId)
  return {
    ...record,
    vehicle,
    trip,
    vehicleRegistration: vehicle?.registrationNumber || null,
    vehicleName: vehicle?.vehicleName || null,
    tripNumber: trip?.tripNumber || null,
    costPerLitre: costPerLitre(record.liters, record.cost),
  }
}

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

export const fuelMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().fuelLogs]

    if (query.vehicleId) {
      items = items.filter((item) => item.vehicleId === query.vehicleId)
    }

    if (query.tripId) {
      items = items.filter((item) => item.tripId === query.tripId)
    }

    if (query.dateFrom || query.dateTo) {
      items = items.filter((item) =>
        inDateRange(item.fuelDate, query.dateFrom, query.dateTo),
      )
    }

    const term = String(query.search || '')
      .trim()
      .toLowerCase()
    if (term) {
      items = items.filter((item) => {
        const vehicle = getVehicle(item.vehicleId)
        const trip = getTrip(item.tripId)
        const haystack = [
          item.stationName,
          item.notes,
          item.id,
          vehicle?.registrationNumber,
          vehicle?.vehicleName,
          trip?.tripNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
    } else {
      items = applySearch(items, query, ['stationName', 'notes', 'id'])
    }

    items = applySort(items, query, 'fuelDate')
    const page = paginateItems(items, query)
    return {
      ...page,
      data: page.data.map((item) => enrichFuelLog(item)),
    }
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(enrichFuelLog(findFuelOrThrow(id)))
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()

    if (!db.vehicles.some((item) => item.id === payload.vehicleId)) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle not found',
        fieldErrors: { vehicleId: 'Vehicle not found' },
      })
    }

    if (
      payload.tripId &&
      !db.trips.some((item) => item.id === payload.tripId)
    ) {
      throw new ApiError({
        status: 400,
        code: 'TRIP_NOT_FOUND',
        message: 'Trip not found',
        fieldErrors: { tripId: 'Trip not found' },
      })
    }

    const now = new Date().toISOString()
    const record = {
      id: createId('fuel'),
      vehicleId: payload.vehicleId,
      tripId: payload.tripId || null,
      liters: Number(payload.liters),
      cost: Number(payload.cost),
      fuelDate: payload.fuelDate,
      odometerReading: Number(payload.odometerReading || 0),
      stationName: String(payload.stationName || '').trim(),
      notes: String(payload.notes || '').trim(),
      createdAt: now,
      updatedAt: now,
    }

    db.fuelLogs.unshift(record)
    return singleResponse(enrichFuelLog(record))
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const record = findFuelOrThrow(id)

    if (
      payload.tripId &&
      !db.trips.some((item) => item.id === payload.tripId)
    ) {
      throw new ApiError({
        status: 400,
        code: 'TRIP_NOT_FOUND',
        message: 'Trip not found',
        fieldErrors: { tripId: 'Trip not found' },
      })
    }

    Object.assign(record, {
      vehicleId: payload.vehicleId ?? record.vehicleId,
      tripId:
        payload.tripId === undefined ? record.tripId : payload.tripId || null,
      liters: Number(payload.liters ?? record.liters),
      cost: Number(payload.cost ?? record.cost),
      fuelDate: payload.fuelDate ?? record.fuelDate,
      odometerReading: Number(
        payload.odometerReading ?? record.odometerReading,
      ),
      stationName: String(payload.stationName ?? record.stationName).trim(),
      notes: String(payload.notes ?? record.notes).trim(),
      updatedAt: new Date().toISOString(),
    })

    return singleResponse(enrichFuelLog(record))
  },

  async remove(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const index = db.fuelLogs.findIndex((item) => item.id === id)

    if (index < 0) {
      throw new ApiError({
        status: 404,
        code: 'FUEL_NOT_FOUND',
        message: 'Fuel log not found',
      })
    }

    const [removed] = db.fuelLogs.splice(index, 1)
    return singleResponse(enrichFuelLog(removed))
  },
}
