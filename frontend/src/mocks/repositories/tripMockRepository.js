import { ApiError } from '../../api/apiError'
import {
  DRIVER_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'
import { isLicenseExpired } from '../../utils/dateHelpers'
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

function findTripOrThrow(id) {
  const trip = getDb().trips.find((item) => item.id === id)
  if (!trip) {
    throw new ApiError({
      status: 404,
      code: 'TRIP_NOT_FOUND',
      message: 'Trip not found',
    })
  }
  return trip
}

function assertDispatchResources(vehicle, driver, cargoWeight) {
  if (!vehicle) {
    throw new ApiError({
      status: 400,
      code: 'VEHICLE_REQUIRED',
      message: 'Vehicle not found',
      fieldErrors: { vehicleId: 'Vehicle not found' },
    })
  }

  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    throw new ApiError({
      status: 400,
      code: 'VEHICLE_UNAVAILABLE',
      message: 'Only AVAILABLE vehicles can dispatch',
      fieldErrors: { vehicleId: 'Vehicle is not available for dispatch' },
    })
  }

  if (Number(cargoWeight) > Number(vehicle.maxLoadCapacity)) {
    throw new ApiError({
      status: 400,
      code: 'CARGO_EXCEEDS_CAPACITY',
      message: 'Cargo cannot exceed capacity',
      fieldErrors: { cargoWeight: 'Cargo cannot exceed capacity' },
    })
  }

  if (!driver) {
    throw new ApiError({
      status: 400,
      code: 'DRIVER_REQUIRED',
      message: 'Driver not found',
      fieldErrors: { driverId: 'Driver not found' },
    })
  }

  if (driver.status !== DRIVER_STATUS.AVAILABLE) {
    throw new ApiError({
      status: 400,
      code: 'DRIVER_UNAVAILABLE',
      message: 'Only AVAILABLE drivers can dispatch',
      fieldErrors: { driverId: 'Driver is not available for dispatch' },
    })
  }

  if (isLicenseExpired(driver.licenseExpiryDate)) {
    throw new ApiError({
      status: 400,
      code: 'DRIVER_LICENSE_EXPIRED',
      message: 'Expired drivers cannot dispatch',
      fieldErrors: { driverId: 'Driver licence is expired' },
    })
  }
}

export const tripMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().trips]
    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }
    items = applySearch(items, query, ['source', 'destination', 'id'])
    items = applySort(items, query, 'createdAt')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findTripOrThrow(id))
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const vehicle = db.vehicles.find((item) => item.id === payload.vehicleId)
    const driver = db.drivers.find((item) => item.id === payload.driverId)

    if (!vehicle) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle not found',
        fieldErrors: { vehicleId: 'Vehicle not found' },
      })
    }

    if (!driver) {
      throw new ApiError({
        status: 400,
        code: 'DRIVER_REQUIRED',
        message: 'Driver not found',
        fieldErrors: { driverId: 'Driver not found' },
      })
    }

    if (Number(payload.cargoWeight) > Number(vehicle.maxLoadCapacity)) {
      throw new ApiError({
        status: 400,
        code: 'CARGO_EXCEEDS_CAPACITY',
        message: 'Cargo cannot exceed capacity',
        fieldErrors: { cargoWeight: 'Cargo cannot exceed capacity' },
      })
    }

    const trip = {
      id: createId('trip'),
      source: String(payload.source || '').trim(),
      destination: String(payload.destination || '').trim(),
      vehicleId: payload.vehicleId,
      driverId: payload.driverId,
      cargoWeight: Number(payload.cargoWeight),
      plannedDistance: Number(payload.plannedDistance),
      revenue:
        payload.revenue == null || payload.revenue === ''
          ? null
          : Number(payload.revenue),
      status: TRIP_STATUS.DRAFT,
      startOdometer: Number(vehicle.odometer || 0),
      createdAt: new Date().toISOString(),
    }

    db.trips.unshift(trip)
    return singleResponse(trip)
  },

  async updateDraft(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (trip.status !== TRIP_STATUS.DRAFT) {
      throw new ApiError({
        status: 400,
        code: 'TRIP_NOT_DRAFT',
        message: 'Only draft trips can be edited',
      })
    }

    const vehicleId = payload.vehicleId ?? trip.vehicleId
    const driverId = payload.driverId ?? trip.driverId
    const vehicle = db.vehicles.find((item) => item.id === vehicleId)
    const driver = db.drivers.find((item) => item.id === driverId)
    const cargoWeight = Number(payload.cargoWeight ?? trip.cargoWeight)

    if (!vehicle || !driver) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_RESOURCES',
        message: 'Vehicle or driver not found',
      })
    }

    if (cargoWeight > Number(vehicle.maxLoadCapacity)) {
      throw new ApiError({
        status: 400,
        code: 'CARGO_EXCEEDS_CAPACITY',
        message: 'Cargo cannot exceed capacity',
        fieldErrors: { cargoWeight: 'Cargo cannot exceed capacity' },
      })
    }

    Object.assign(trip, {
      source: String(payload.source ?? trip.source).trim(),
      destination: String(payload.destination ?? trip.destination).trim(),
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance: Number(payload.plannedDistance ?? trip.plannedDistance),
      revenue:
        payload.revenue === undefined
          ? trip.revenue
          : payload.revenue === '' || payload.revenue == null
            ? null
            : Number(payload.revenue),
      startOdometer: Number(vehicle.odometer || trip.startOdometer || 0),
      updatedAt: new Date().toISOString(),
    })

    return singleResponse(trip)
  },

  async dispatch(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (trip.status !== TRIP_STATUS.DRAFT) {
      throw new ApiError({
        status: 400,
        code: 'TRIP_NOT_DRAFT',
        message: 'Only draft trips can be dispatched',
      })
    }

    const vehicle = db.vehicles.find((item) => item.id === trip.vehicleId)
    const driver = db.drivers.find((item) => item.id === trip.driverId)
    assertDispatchResources(vehicle, driver, trip.cargoWeight)

    // Linked status changes succeed together.
    trip.status = TRIP_STATUS.DISPATCHED
    trip.dispatchedAt = new Date().toISOString()
    trip.startOdometer = Number(vehicle.odometer || 0)
    vehicle.status = VEHICLE_STATUS.ON_TRIP
    driver.status = DRIVER_STATUS.ON_TRIP
    vehicle.updatedAt = trip.dispatchedAt
    driver.updatedAt = trip.dispatchedAt

    return singleResponse(trip)
  },

  async complete(id, payload = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (trip.status !== TRIP_STATUS.DISPATCHED) {
      throw new ApiError({
        status: 400,
        code: 'TRIP_NOT_DISPATCHED',
        message: 'Only dispatched trips can be completed',
      })
    }

    const vehicle = db.vehicles.find((item) => item.id === trip.vehicleId)
    const driver = db.drivers.find((item) => item.id === trip.driverId)

    if (!vehicle || !driver) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_RESOURCES',
        message: 'Linked vehicle or driver not found',
      })
    }

    const finalOdometer = Number(payload.finalOdometer)
    if (finalOdometer < Number(trip.startOdometer || 0)) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_ODOMETER',
        message: 'Final odometer cannot be less than start odometer',
        fieldErrors: {
          finalOdometer: 'Final odometer cannot be less than start odometer',
        },
      })
    }

    const completedAt = new Date().toISOString()
    trip.status = TRIP_STATUS.COMPLETED
    trip.finalOdometer = finalOdometer
    trip.fuelConsumed = Number(payload.fuelConsumed)
    trip.fuelCost = Number(payload.fuelCost)
    trip.revenue =
      payload.revenue == null || payload.revenue === ''
        ? trip.revenue
        : Number(payload.revenue)
    trip.completedAt = completedAt

    vehicle.status = VEHICLE_STATUS.AVAILABLE
    vehicle.odometer = finalOdometer
    driver.status = DRIVER_STATUS.AVAILABLE
    vehicle.updatedAt = completedAt
    driver.updatedAt = completedAt

    return singleResponse(trip)
  },

  async cancel(id, payload = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (
      ![TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED].includes(trip.status)
    ) {
      throw new ApiError({
        status: 400,
        code: 'TRIP_NOT_CANCELLABLE',
        message: 'Only draft or dispatched trips can be cancelled',
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

    const wasDispatched = trip.status === TRIP_STATUS.DISPATCHED
    const cancelledAt = new Date().toISOString()

    trip.status = TRIP_STATUS.CANCELLED
    trip.cancelReason = reason
    trip.cancelledAt = cancelledAt

    if (wasDispatched) {
      const vehicle = db.vehicles.find((item) => item.id === trip.vehicleId)
      const driver = db.drivers.find((item) => item.id === trip.driverId)

      if (!vehicle || !driver) {
        throw new ApiError({
          status: 400,
          code: 'INVALID_RESOURCES',
          message: 'Linked vehicle or driver not found',
        })
      }

      vehicle.status = VEHICLE_STATUS.AVAILABLE
      driver.status = DRIVER_STATUS.AVAILABLE
      vehicle.updatedAt = cancelledAt
      driver.updatedAt = cancelledAt
    }

    return singleResponse(trip)
  },
}
