import { keysToCamelCase } from './caseMapper'
import {
  fromApiEnvelope,
  mapSingleResponse,
  toApiParams,
} from './apiEnvelope'

export function fromApi(entity) {
  if (entity == null) return entity
  return keysToCamelCase(entity)
}

export function toApi(entity) {
  return toApiParams(entity)
}

export function fromApiSummary(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function fromApiResponse(payload) {
  return fromApiEnvelope(payload)
}

export function toApiQuery(params) {
  return toApiParams(params)
}
