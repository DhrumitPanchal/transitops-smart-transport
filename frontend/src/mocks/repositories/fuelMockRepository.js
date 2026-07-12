import { ApiError } from '../../api/apiError'
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

export const fuelMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().fuelLogs]
    if (query.vehicleId) {
      items = items.filter((item) => item.vehicleId === query.vehicleId)
    }
    items = applySearch(items, query, ['stationName', 'notes', 'id'])
    items = applySort(items, query, 'fuelDate')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findFuelOrThrow(id))
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
      createdAt: new Date().toISOString(),
    }

    db.fuelLogs.unshift(record)
    return singleResponse(record)
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const record = findFuelOrThrow(id)

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

    return singleResponse(record)
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
    return singleResponse(removed)
  },
}
