import { keysToCamelCase } from './caseMapper'
import {
  mapLifecycleResponse,
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'
import { fromApi as vehicleFromApi } from './vehicleMapper'
import { fromApi as driverFromApi } from './driverMapper'
import { fromApi as fuelFromApi } from './fuelMapper'

export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  return {
    ...mapped,
    plannedDistance:
      mapped.plannedDistance ??
      (mapped.distance != null ? Number(mapped.distance) : null),
    distance:
      mapped.distance != null
        ? Number(mapped.distance)
        : mapped.plannedDistance,
    // Backend Trip has no revenue column yet.
    revenue: mapped.revenue != null ? Number(mapped.revenue) : mapped.revenue ?? 0,
    cargoWeight:
      mapped.cargoWeight != null ? Number(mapped.cargoWeight) : mapped.cargoWeight,
    vehicle: mapped.vehicle ? vehicleFromApi(mapped.vehicle) : mapped.vehicle,
    driver: mapped.driver ? driverFromApi(mapped.driver) : mapped.driver,
  }
}

export function toApi(entity) {
  return entity
}

export function fromApiList(payload) {
  return mapListResponse(payload, fromApi)
}

export function fromApiDetail(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function fromApiLifecycle(payload) {
  return mapLifecycleResponse(payload, {
    trip: fromApi,
    vehicle: vehicleFromApi,
    driver: driverFromApi,
    fuelLog: fuelFromApi,
  })
}

export function toApiRequest(payload = {}) {
  if (payload == null || typeof payload !== 'object') return payload
  const body = { ...toApiBody(payload) }

  if (body.plannedDistance != null && body.distance == null) {
    body.distance = body.plannedDistance
  }
  // Drop unsupported revenue until schema supports it
  delete body.revenue

  return body
}

export function toApiQuery(params = {}) {
  const query = toApiParams(params)
  if (query.sortBy === 'plannedDistance') query.sortBy = 'distance'
  return query
}
