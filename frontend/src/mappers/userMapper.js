import { keysToCamelCase, keysToSnakeCase } from './caseMapper'
import {
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'

export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  const safe = { ...mapped }
  delete safe.password
  delete safe.passwordHash
  return safe
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

export function toApiRequest(payload) {
  return toApiBody(payload)
}

export function toApiQuery(params) {
  return toApiParams(params)
}
