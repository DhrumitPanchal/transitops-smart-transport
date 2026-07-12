import { ApiError } from '../../api/apiError'
import {
  MAINTENANCE_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'
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

function getVehicle(vehicleId) {
  return getDb().vehicles.find((item) => item.id === vehicleId) || null
}

function enrichMaintenance(record) {
  const vehicle = getVehicle(record.vehicleId)
  return {
    ...record,
    vehicle,
    vehicleRegistration: vehicle?.registrationNumber || null,
    vehicleName: vehicle?.vehicleName || null,
  }
}

function inDateRange(startDate, dateFrom, dateTo) {
  const start = parseDateValue(startDate)
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

function linkedResponse(record, vehicle) {
  return {
    data: {
      maintenance: enrichMaintenance(record),
      vehicle: vehicle ? { ...vehicle } : null,
    },
  }
}

function assertVehicleEligible(vehicle) {
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
}

export const maintenanceMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    let items = [...db.maintenance]

    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }

    if (query.maintenanceType) {
      items = items.filter(
        (item) => item.maintenanceType === query.maintenanceType,
      )
    }

    if (query.vehicleId) {
      items = items.filter((item) => item.vehicleId === query.vehicleId)
    }

    if (query.dateFrom || query.dateTo) {
      items = items.filter((item) =>
        inDateRange(item.startDate, query.dateFrom, query.dateTo),
      )
    }

    const term = String(query.search || '')
      .trim()
      .toLowerCase()
    if (term) {
      items = items.filter((item) => {
        const vehicle = getVehicle(item.vehicleId)
        const haystack = [
          item.description,
          item.vendorName,
          item.id,
          vehicle?.registrationNumber,
          vehicle?.vehicleName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
    } else {
      items = applySearch(items, query, ['description', 'vendorName', 'id'])
    }

    items = applySort(items, query, 'createdAt')
    const page = paginateItems(items, query)
    return {
      ...page,
      data: page.data.map((item) => enrichMaintenance(item)),
    }
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(enrichMaintenance(findMaintenanceOrThrow(id)))
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const vehicle = db.vehicles.find((item) => item.id === payload.vehicleId)
    assertVehicleEligible(vehicle)

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

    const now = new Date().toISOString()
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
      createdAt: now,
      updatedAt: now,
    }

    db.maintenance.unshift(record)
    vehicle.status = VEHICLE_STATUS.IN_SHOP
    vehicle.updatedAt = now

    return linkedResponse(record, vehicle)
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

    const vehicle = getVehicle(record.vehicleId)
    return linkedResponse(record, vehicle)
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
    record.cost = Number(payload.finalCost ?? record.cost)
    record.notes = String(payload.notes ?? record.notes).trim()
    record.completedAt = completedAt
    record.updatedAt = completedAt

    if (vehicle.status !== VEHICLE_STATUS.RETIRED) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE
      vehicle.updatedAt = completedAt
    }

    return linkedResponse(record, vehicle)
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
    record.updatedAt = cancelledAt

    if (vehicle && vehicle.status !== VEHICLE_STATUS.RETIRED) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE
      vehicle.updatedAt = cancelledAt
    }

    return linkedResponse(record, vehicle)
  },
}
