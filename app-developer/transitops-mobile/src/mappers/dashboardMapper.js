import { keysToCamelCase } from './caseMapper'
import { fromApiEnvelope, mapSingleResponse } from './apiEnvelope'

export function fromApi(entity) {
  if (entity == null) return entity
  return keysToCamelCase(entity)
}

export function toApi() {
  return undefined
}

export function fromApiSummary(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function fromApiResponse(payload) {
  return fromApiEnvelope(payload)
}
