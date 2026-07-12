import { keysToCamelCase, keysToSnakeCase } from './caseMapper'
import {
  mapLifecycleResponse,
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'
import { fromApi as vehicleFromApi } from './vehicleMapper'

export function fromApi(entity) {
  if (entity == null) return entity
  return keysToCamelCase(entity)
}

export function toApi(entity) {
  if (entity == null) return entity
  return keysToSnakeCase(entity)
}

export function fromApiList(payload) {
  return mapListResponse(payload, fromApi)
}

export function fromApiDetail(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function fromApiLifecycle(payload) {
  return mapLifecycleResponse(payload, {
    maintenance: fromApi,
    vehicle: vehicleFromApi,
  })
}

export function toApiRequest(payload) {
  return toApiBody(payload)
}

export function toApiQuery(params) {
  return toApiParams(params)
}
