import { ApiError } from '../../api/apiError'
import {
  MAINTENANCE_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'
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

function findMaintenanceOrThrow(id) {
  const record = getDb().maintenance.find((item) => item.id === id)
  if (!record) {
    throw new ApiError({
      status: 404,
      code: 'MAINTENANCE_NOT_FOUND',
      message: 'Maintenance record not found',
    })
  }
  return record
}

export const maintenanceMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().maintenance]
    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }
    if (query.vehicleId) {
      items = items.filter((item) => item.vehicleId === query.vehicleId)
    }
    items = applySearch(items, query, ['description', 'vendorName', 'id'])
    items = applySort(items, query, 'createdAt')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findMaintenanceOrThrow(id))
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const vehicle = db.vehicles.find((item) => item.id === payload.vehicleId)

    if (!vehicle) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle not found',
        fieldErrors: { vehicleId: 'Vehicle not found' },
      })
    }

    if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_ON_TRIP',
        message: 'ON_TRIP vehicle cannot enter maintenance',
        fieldErrors: { vehicleId: 'ON_TRIP vehicle cannot enter maintenance' },
      })
    }

    if (vehicle.status === VEHICLE_STATUS.RETIRED) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_RETIRED',
        message: 'Retired vehicles cannot enter maintenance',
        fieldErrors: { vehicleId: 'Retired vehicles cannot enter maintenance' },
      })
    }

    const status = payload.status || MAINTENANCE_STATUS.OPEN
    if (
      ![MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
        status,
      )
    ) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_STATUS',
        message: 'New maintenance must be OPEN or IN_PROGRESS',
        fieldErrors: { status: 'New maintenance must be OPEN or IN_PROGRESS' },
      })
    }

    const record = {
      id: createId('mnt'),
      vehicleId: payload.vehicleId,
      maintenanceType: payload.maintenanceType,
      description: String(payload.description || '').trim(),
      startDate: payload.startDate,
      expectedEndDate: payload.expectedEndDate,
      cost: Number(payload.cost || 0),
      vendorName: String(payload.vendorName || '').trim(),
      notes: String(payload.notes || '').trim(),
      status,
      createdAt: new Date().toISOString(),
    }

    db.maintenance.unshift(record)
    vehicle.status = VEHICLE_STATUS.IN_SHOP
    vehicle.updatedAt = record.createdAt

    return singleResponse(record)
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const record = findMaintenanceOrThrow(id)

    if (
      ![MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
        record.status,
      )
    ) {
      throw new ApiError({
        status: 400,
        code: 'MAINTENANCE_LOCKED',
        message: 'Completed or cancelled maintenance cannot be edited',
      })
    }

    Object.assign(record, {
      maintenanceType: payload.maintenanceType ?? record.maintenanceType,
      description: String(payload.description ?? record.description).trim(),
      startDate: payload.startDate ?? record.startDate,
      expectedEndDate: payload.expectedEndDate ?? record.expectedEndDate,
      cost: Number(payload.cost ?? record.cost),
      vendorName: String(payload.vendorName ?? record.vendorName).trim(),
      notes: String(payload.notes ?? record.notes).trim(),
      status: payload.status ?? record.status,
      updatedAt: new Date().toISOString(),
    })

    return singleResponse(record)
  },

  async complete(id, payload = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const record = findMaintenanceOrThrow(id)

    if (
      ![MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
        record.status,
      )
    ) {
      throw new ApiError({
        status: 400,
        code: 'MAINTENANCE_NOT_ACTIVE',
        message: 'Only open or in-progress maintenance can be completed',
      })
    }

    const vehicle = db.vehicles.find((item) => item.id === record.vehicleId)
    if (!vehicle) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Linked vehicle not found',
      })
    }

    const completedAt = new Date().toISOString()
    record.status = MAINTENANCE_STATUS.COMPLETED
    record.completionDate = payload.completionDate
    record.finalCost = Number(payload.finalCost ?? record.cost)
    record.notes = String(payload.notes ?? record.notes).trim()
    record.completedAt = completedAt

    if (vehicle.status !== VEHICLE_STATUS.RETIRED) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE
      vehicle.updatedAt = completedAt
    }

    return singleResponse(record)
  },

  async cancel(id, payload = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const record = findMaintenanceOrThrow(id)

    if (
      ![MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
        record.status,
      )
    ) {
      throw new ApiError({
        status: 400,
        code: 'MAINTENANCE_NOT_ACTIVE',
        message: 'Only open or in-progress maintenance can be cancelled',
      })
    }

    const reason = String(payload.reason || '').trim()
    if (reason.length < 3) {
      throw new ApiError({
        status: 400,
        code: 'CANCEL_REASON_REQUIRED',
        message: 'Cancellation reason is required',
        fieldErrors: { reason: 'Cancellation reason is required' },
      })
    }

    const vehicle = db.vehicles.find((item) => item.id === record.vehicleId)
    const cancelledAt = new Date().toISOString()

    record.status = MAINTENANCE_STATUS.CANCELLED
    record.cancelReason = reason
    record.cancelledAt = cancelledAt

    if (vehicle && vehicle.status !== VEHICLE_STATUS.RETIRED) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE
      vehicle.updatedAt = cancelledAt
    }

    return singleResponse(record)
  },
}
