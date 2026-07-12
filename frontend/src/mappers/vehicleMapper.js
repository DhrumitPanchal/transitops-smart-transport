import { keysToCamelCase } from './caseMapper'
import {
  mapLifecycleResponse,
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'

export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  return {
    ...mapped,
    odometer:
      mapped.odometer ??
      (mapped.currentOdometer != null ? Number(mapped.currentOdometer) : null),
    currentOdometer:
      mapped.currentOdometer != null
        ? Number(mapped.currentOdometer)
        : mapped.odometer,
    acquisitionCost:
      mapped.acquisitionCost ??
      (mapped.purchaseCost != null ? Number(mapped.purchaseCost) : null),
    purchaseCost:
      mapped.purchaseCost != null
        ? Number(mapped.purchaseCost)
        : mapped.acquisitionCost,
    capacity: mapped.capacity != null ? Number(mapped.capacity) : mapped.capacity,
    maxLoadCapacity:
      mapped.maxLoadCapacity ??
      (mapped.capacity != null ? Number(mapped.capacity) : null),
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
    vehicle: fromApi,
  })
}

export function toApiRequest(payload = {}) {
  if (payload == null || typeof payload !== 'object') return payload
  const body = { ...toApiBody(payload) }

  if (body.odometer != null && body.currentOdometer == null) {
    body.currentOdometer = body.odometer
  }
  if (body.acquisitionCost != null && body.purchaseCost == null) {
    body.purchaseCost = body.acquisitionCost
  }
  if (body.maxLoadCapacity != null && body.capacity == null) {
    body.capacity = body.maxLoadCapacity
  }

  return body
}

export function toApiQuery(params = {}) {
  const query = toApiParams(params)
  if (query.sortBy === 'odometer') query.sortBy = 'currentOdometer'
  if (query.sortBy === 'acquisitionCost') query.sortBy = 'purchaseCost'
  if (query.sortBy === 'name') query.sortBy = 'vehicleName'
  if (query.sortBy === 'type') query.sortBy = 'vehicleType'
  return query
}
