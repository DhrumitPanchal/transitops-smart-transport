import { keysToCamelCase } from './caseMapper'
import {
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'

function buildDisplayName(entity) {
  if (entity.name && String(entity.name).trim()) {
    return String(entity.name).trim()
  }
  return [entity.firstName, entity.lastName].filter(Boolean).join(' ').trim()
}

export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  return {
    ...mapped,
    name: buildDisplayName(mapped),
    contactNumber: mapped.contactNumber || mapped.phone || '',
    phone: mapped.phone || mapped.contactNumber || '',
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

/**
 * Map frontend driver form fields to backend create/update body.
 */
export function toApiRequest(payload = {}) {
  if (payload == null || typeof payload !== 'object') return payload

  const body = { ...toApiBody(payload) }

  if (body.name != null && (body.firstName == null || body.lastName == null)) {
    const trimmed = String(body.name).trim().replace(/\s+/g, ' ')
    const parts = trimmed.split(' ').filter(Boolean)
    if (parts.length === 1) {
      body.firstName = body.firstName ?? parts[0]
      body.lastName = body.lastName ?? parts[0]
    } else if (parts.length > 1) {
      body.firstName = body.firstName ?? parts[0]
      body.lastName = body.lastName ?? parts.slice(1).join(' ')
    }
  }

  if (body.contactNumber != null && body.phone == null) {
    body.phone = body.contactNumber
  }

  return body
}

export function toApiQuery(params = {}) {
  const query = toApiParams(params)

  if (query.sortBy === 'name') {
    query.sortBy = 'firstName'
  }
  if (query.sortBy === 'contactNumber') {
    query.sortBy = 'phone'
  }

  return query
}
