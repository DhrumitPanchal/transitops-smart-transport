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

export function toApiQuery(params = {}) {
  const query = toApiParams(params)

  // Backend accepts both dateFrom/dateTo and fromDate/toDate.
  if (query.dateFrom && !query.fromDate) {
    query.fromDate = query.dateFrom
  }
  if (query.dateTo && !query.toDate) {
    query.toDate = query.dateTo
  }

  return query
}
