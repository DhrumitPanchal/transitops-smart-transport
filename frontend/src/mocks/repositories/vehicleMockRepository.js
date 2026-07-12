import { ApiError } from '../../api/apiError'
import { VEHICLE_STATUS } from '../../constants/statuses'
import { mockDelay } from '../mockDelay'
import { getDb } from '../db'
import {
  applySearch,
  applySort,
  createId,
  normalizeCode,
  paginateItems,
  singleResponse,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findVehicleOrThrow(id) {
  const vehicle = getDb().vehicles.find((item) => item.id === id)
  if (!vehicle) {
    throw new ApiError({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
      message: 'Vehicle not found',
    })
  }
  return vehicle
}

export const vehicleMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()

    let items = [...db.vehicles]
    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }
    items = applySearch(items, query, [
      'registrationNumber',
      'vehicleName',
      'model',
      'region',
    ])
    items = applySort(items, query, 'registrationNumber')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findVehicleOrThrow(id))
  },

  async getAvailable(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const items = getDb().vehicles.filter(
      (item) => item.status === VEHICLE_STATUS.AVAILABLE,
    )
    return paginateItems(applySort(items, query, 'registrationNumber'), {
      ...query,
      pageSize: query.pageSize || items.length || 10,
    })
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const registrationNumber = normalizeCode(payload.registrationNumber)

    if (
      db.vehicles.some((item) => item.registrationNumber === registrationNumber)
    ) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_REGISTRATION',
        message: 'Registration number already exists',
        fieldErrors: {
          registrationNumber: 'Registration number already exists',
        },
      })
    }

    if (
      [VEHICLE_STATUS.ON_TRIP, VEHICLE_STATUS.IN_SHOP].includes(payload.status)
    ) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_STATUS',
        message: 'ON_TRIP and IN_SHOP cannot be selected manually',
        fieldErrors: { status: 'Invalid status for create' },
      })
    }

    const vehicle = {
      id: createId('veh'),
      registrationNumber,
      vehicleName: String(payload.vehicleName || '').trim(),
      model: String(payload.model || '').trim(),
      vehicleType: payload.vehicleType,
      maxLoadCapacity: Number(payload.maxLoadCapacity),
      odometer: Number(payload.odometer || 0),
      acquisitionCost: Number(payload.acquisitionCost || 0),
      region: String(payload.region || '').trim(),
      status: payload.status || VEHICLE_STATUS.AVAILABLE,
      createdAt: new Date().toISOString(),
    }

    db.vehicles.unshift(vehicle)
    return singleResponse(vehicle)
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const vehicle = findVehicleOrThrow(id)
    const registrationNumber = normalizeCode(
      payload.registrationNumber ?? vehicle.registrationNumber,
    )

    if (
      db.vehicles.some(
        (item) =>
          item.id !== id && item.registrationNumber === registrationNumber,
      )
    ) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_REGISTRATION',
        message: 'Registration number already exists',
        fieldErrors: {
          registrationNumber: 'Registration number already exists',
        },
      })
    }

    if (
      payload.status &&
      [VEHICLE_STATUS.ON_TRIP, VEHICLE_STATUS.IN_SHOP].includes(payload.status)
    ) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_STATUS',
        message: 'ON_TRIP and IN_SHOP cannot be selected manually',
        fieldErrors: { status: 'Invalid status for update' },
      })
    }

    Object.assign(vehicle, {
      registrationNumber,
      vehicleName: String(payload.vehicleName ?? vehicle.vehicleName).trim(),
      model: String(payload.model ?? vehicle.model).trim(),
      vehicleType: payload.vehicleType ?? vehicle.vehicleType,
      maxLoadCapacity: Number(
        payload.maxLoadCapacity ?? vehicle.maxLoadCapacity,
      ),
      odometer: Number(payload.odometer ?? vehicle.odometer),
      acquisitionCost: Number(
        payload.acquisitionCost ?? vehicle.acquisitionCost,
      ),
      region: String(payload.region ?? vehicle.region).trim(),
      status: payload.status ?? vehicle.status,
      updatedAt: new Date().toISOString(),
    })

    return singleResponse(vehicle)
  },

  async retire(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const vehicle = findVehicleOrThrow(id)

    if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_ON_TRIP',
        message: 'ON_TRIP vehicle cannot retire',
      })
    }

    if (vehicle.status === VEHICLE_STATUS.RETIRED) {
      return singleResponse(vehicle)
    }

    vehicle.status = VEHICLE_STATUS.RETIRED
    vehicle.updatedAt = new Date().toISOString()
    return singleResponse(vehicle)
  },
}
