import {
  DRIVER_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'
import { isLicenseExpired, parseDateValue } from '../../utils/dateHelpers'
import { mockDelay } from '../mockDelay'
import { ensureMockDbReady, getDb, persistDb } from '../mockDatabase'
import {
  applySearch,
  applySort,
  createId,
  paginateItems,
  singleResponse,
  throwMockError,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findTripOrThrow(id) {
  const trip = getDb().trips.find((item) => item.id === id)
  if (!trip) {
    throwMockError({
      status: 404,
      code: 'TRIP_NOT_FOUND',
      message: 'Trip not found',
    })
  }
  return trip
}

function getLinkedResources(trip) {
  const db = getDb()
  const vehicle = db.vehicles.find((item) => item.id === trip.vehicleId) || null
  const driver = db.drivers.find((item) => item.id === trip.driverId) || null
  return { vehicle, driver }
}

function enrichTrip(trip) {
  const { vehicle, driver } = getLinkedResources(trip)
  return {
    ...trip,
    tripNumber: trip.tripNumber || trip.id,
    vehicle,
    driver,
    vehicleRegistration: vehicle?.registrationNumber || null,
    vehicleName: vehicle?.vehicleName || null,
    vehicleCapacity: vehicle?.maxLoadCapacity ?? null,
    driverName: driver?.name || null,
    driverLicenseCategory: driver?.licenseCategory || null,
  }
}

function assertDispatchResources(vehicle, driver, cargoWeight) {
  if (!vehicle) {
    throwMockError({
      status: 400,
      code: 'VEHICLE_REQUIRED',
      message: 'Vehicle not found',
      fieldErrors: { vehicleId: 'Vehicle not found' },
    })
  }

  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    throwMockError({
      status: 400,
      code: 'VEHICLE_UNAVAILABLE',
      message: 'Only AVAILABLE vehicles can dispatch',
      fieldErrors: { vehicleId: 'Vehicle is not available for dispatch' },
    })
  }

  if (Number(cargoWeight) > Number(vehicle.maxLoadCapacity)) {
    throwMockError({
      status: 400,
      code: 'CARGO_EXCEEDS_CAPACITY',
      message: 'Cargo cannot exceed capacity',
      fieldErrors: { cargoWeight: 'Cargo cannot exceed capacity' },
    })
  }

  if (!driver) {
    throwMockError({
      status: 400,
      code: 'DRIVER_REQUIRED',
      message: 'Driver not found',
      fieldErrors: { driverId: 'Driver not found' },
    })
  }

  if (driver.status !== DRIVER_STATUS.AVAILABLE) {
    throwMockError({
      status: 400,
      code: 'DRIVER_UNAVAILABLE',
      message: 'Only AVAILABLE drivers can dispatch',
      fieldErrors: { driverId: 'Driver is not available for dispatch' },
    })
  }

  if (isLicenseExpired(driver.licenseExpiryDate)) {
    throwMockError({
      status: 400,
      code: 'DRIVER_LICENSE_EXPIRED',
      message: 'Expired drivers cannot dispatch',
      fieldErrors: { driverId: 'Driver licence is expired' },
    })
  }
}

function inDateRange(createdAt, dateFrom, dateTo) {
  const created = parseDateValue(createdAt)
  if (!created) return true

  if (dateFrom) {
    const from = parseDateValue(dateFrom)
    if (from && created < from) return false
  }

  if (dateTo) {
    const to = parseDateValue(dateTo)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      if (created > end) return false
    }
  }

  return true
}

function linkedResponse(trip, extras = {}) {
  const enriched = enrichTrip(trip)
  return {
    success: true,
    data: {
      item: enriched,
      trip: enriched,
      vehicle: extras.vehicle ?? enriched.vehicle,
      driver: extras.driver ?? enriched.driver,
      fuelLog: extras.fuelLog ?? null,
    },
  }
}

export const tripMockRepository = {
  async list(query = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().trips]

    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }

    if (query.vehicleId) {
      items = items.filter((item) => item.vehicleId === query.vehicleId)
    }

    if (query.driverId) {
      items = items.filter((item) => item.driverId === query.driverId)
    }

    if (query.dateFrom || query.dateTo) {
      items = items.filter((item) =>
        inDateRange(item.createdAt, query.dateFrom, query.dateTo),
      )
    }

    items = applySearch(items, query, [
      'source',
      'destination',
      'id',
      'tripNumber',
    ])
    items = applySort(items, query, 'createdAt')
    return paginateItems(
      items.map((trip) => enrichTrip(trip)),
      query,
    )
  },

  async getById(id) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(enrichTrip(findTripOrThrow(id)))
  },

  async create(payload) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const vehicle = db.vehicles.find((item) => item.id === payload.vehicleId)
    const driver = db.drivers.find((item) => item.id === payload.driverId)

    if (!vehicle) {
      throwMockError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle not found',
        fieldErrors: { vehicleId: 'Vehicle not found' },
      })
    }

    if (!driver) {
      throwMockError({
        status: 400,
        code: 'DRIVER_REQUIRED',
        message: 'Driver not found',
        fieldErrors: { driverId: 'Driver not found' },
      })
    }

    if (Number(payload.cargoWeight) > Number(vehicle.maxLoadCapacity)) {
      throwMockError({
        status: 400,
        code: 'CARGO_EXCEEDS_CAPACITY',
        message: 'Cargo cannot exceed capacity',
        fieldErrors: { cargoWeight: 'Cargo cannot exceed capacity' },
      })
    }

    const now = new Date().toISOString()
    const id = createId('trip')
    const trip = {
      id,
      tripNumber: `TRP-${String(db.trips.length + 1).padStart(4, '0')}`,
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
      createdAt: now,
      updatedAt: now,
    }

    db.trips.unshift(trip)
    await persistDb()
    return singleResponse(enrichTrip(trip), 'Trip created successfully.')
  },

  async updateDraft(id, payload) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (trip.status !== TRIP_STATUS.DRAFT) {
      throwMockError({
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
      throwMockError({
        status: 400,
        code: 'INVALID_RESOURCES',
        message: 'Vehicle or driver not found',
      })
    }

    if (cargoWeight > Number(vehicle.maxLoadCapacity)) {
      throwMockError({
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

    await persistDb()
    return singleResponse(enrichTrip(trip))
  },

  async dispatch(id) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (trip.status !== TRIP_STATUS.DRAFT) {
      throwMockError({
        status: 400,
        code: 'TRIP_NOT_DRAFT',
        message: 'Only draft trips can be dispatched',
      })
    }

    const vehicle = db.vehicles.find((item) => item.id === trip.vehicleId)
    const driver = db.drivers.find((item) => item.id === trip.driverId)
    assertDispatchResources(vehicle, driver, trip.cargoWeight)

    const dispatchedAt = new Date().toISOString()
    trip.status = TRIP_STATUS.DISPATCHED
    trip.dispatchedAt = dispatchedAt
    trip.startOdometer = Number(vehicle.odometer || 0)
    trip.updatedAt = dispatchedAt
    vehicle.status = VEHICLE_STATUS.ON_TRIP
    driver.status = DRIVER_STATUS.ON_TRIP
    vehicle.updatedAt = dispatchedAt
    driver.updatedAt = dispatchedAt

    await persistDb()
    return linkedResponse(trip, {
      vehicle: { ...vehicle },
      driver: { ...driver },
    })
  },

  async complete(id, payload = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (trip.status !== TRIP_STATUS.DISPATCHED) {
      throwMockError({
        status: 400,
        code: 'TRIP_NOT_DISPATCHED',
        message: 'Only dispatched trips can be completed',
      })
    }

    const vehicle = db.vehicles.find((item) => item.id === trip.vehicleId)
    const driver = db.drivers.find((item) => item.id === trip.driverId)

    if (!vehicle || !driver) {
      throwMockError({
        status: 400,
        code: 'INVALID_RESOURCES',
        message: 'Linked vehicle or driver not found',
      })
    }

    const finalOdometer = Number(payload.finalOdometer)
    if (finalOdometer < Number(trip.startOdometer || 0)) {
      throwMockError({
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
    trip.updatedAt = completedAt

    vehicle.status = VEHICLE_STATUS.AVAILABLE
    vehicle.odometer = finalOdometer
    driver.status = DRIVER_STATUS.AVAILABLE
    vehicle.updatedAt = completedAt
    driver.updatedAt = completedAt

    const fuelLog = {
      id: createId('fuel'),
      vehicleId: vehicle.id,
      tripId: trip.id,
      liters: Number(payload.fuelConsumed),
      cost: Number(payload.fuelCost),
      fuelDate: completedAt.slice(0, 10),
      odometerReading: finalOdometer,
      stationName: 'Trip completion',
      notes: 'Auto-logged on trip completion',
      createdAt: completedAt,
    }
    db.fuelLogs.unshift(fuelLog)

    await persistDb()
    return linkedResponse(trip, {
      vehicle: { ...vehicle },
      driver: { ...driver },
      fuelLog,
    })
  },

  async cancel(id, payload = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const trip = findTripOrThrow(id)

    if (![TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED].includes(trip.status)) {
      throwMockError({
        status: 400,
        code: 'TRIP_NOT_CANCELLABLE',
        message: 'Only draft or dispatched trips can be cancelled',
      })
    }

    const reason = String(payload.reason || '').trim()
    if (reason.length < 3) {
      throwMockError({
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
    trip.updatedAt = cancelledAt

    let vehicle
    let driver

    if (wasDispatched) {
      const linkedVehicle = db.vehicles.find((item) => item.id === trip.vehicleId)
      const linkedDriver = db.drivers.find((item) => item.id === trip.driverId)

      if (!linkedVehicle || !linkedDriver) {
        throwMockError({
          status: 400,
          code: 'INVALID_RESOURCES',
          message: 'Linked vehicle or driver not found',
        })
      }

      linkedVehicle.status = VEHICLE_STATUS.AVAILABLE
      linkedDriver.status = DRIVER_STATUS.AVAILABLE
      linkedVehicle.updatedAt = cancelledAt
      linkedDriver.updatedAt = cancelledAt
      vehicle = { ...linkedVehicle }
      driver = { ...linkedDriver }
    } else {
      const linked = getLinkedResources(trip)
      vehicle = linked.vehicle ? { ...linked.vehicle } : null
      driver = linked.driver ? { ...linked.driver } : null
    }

    await persistDb()
    return linkedResponse(trip, { vehicle, driver })
  },
}
