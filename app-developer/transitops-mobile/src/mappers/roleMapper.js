import { keysToCamelCase } from './caseMapper'
import {
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'

/**
 * Normalize role: backend uses `code`, mocks use `key`.
 * App compares against ROLES.* via `key`.
 */
export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  const code = mapped.code ?? mapped.key ?? null

  return {
    ...mapped,
    code,
    key: code,
    permissions: Array.isArray(mapped.permissions) ? mapped.permissions : [],
  }
}

export function toApi(entity) {
  if (entity == null) return entity
  return entity
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
