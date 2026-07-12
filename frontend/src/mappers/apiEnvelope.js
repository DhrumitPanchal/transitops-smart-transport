import { keysToCamelCase, keysToSnakeCase } from './caseMapper'

/**
 * Map a backend response envelope (and nested entities) to frontend camelCase.
 */
export function fromApiEnvelope(payload) {
  if (payload == null) return payload
  return keysToCamelCase(payload)
}

/**
 * Map frontend body to backend snake_case JSON.
 */
export function toApiBody(payload) {
  if (payload == null) return payload
  return keysToSnakeCase(payload)
}

/**
 * Map frontend query params to backend snake_case.
 */
export function toApiParams(params = {}) {
  if (!params || typeof params !== 'object') return params
  return keysToSnakeCase(params)
}

/**
 * Normalize fieldErrors object keys to camelCase for RHF setError.
 */
export function fieldErrorsFromApi(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return null
  return keysToCamelCase(fieldErrors)
}

/**
 * Unwrap `{ data }` list/detail payloads after camelCase mapping.
 */
export function mapListResponse(payload, mapItem = (item) => item) {
  const mapped = fromApiEnvelope(payload)
  if (!mapped || typeof mapped !== 'object') {
    return { data: [], pagination: mapped?.pagination }
  }

  const items = Array.isArray(mapped.data)
    ? mapped.data
    : Array.isArray(mapped.data?.items)
      ? mapped.data.items
      : []

  return {
    ...mapped,
    data: items.map((item) => mapItem(item)),
  }
}

export function mapSingleResponse(payload, mapItem = (item) => item) {
  const mapped = fromApiEnvelope(payload)
  if (!mapped || typeof mapped !== 'object') {
    return { data: null }
  }

  if (mapped.data != null && typeof mapped.data === 'object') {
    return {
      ...mapped,
      data: mapItem(mapped.data),
    }
  }

  return { data: mapItem(mapped) }
}

/**
 * Map lifecycle mutation envelopes that nest multiple entities under data.
 * Leaves unknown keys intact after camelCase conversion.
 */
export function mapLifecycleResponse(payload, entityMappers = {}) {
  const mapped = fromApiEnvelope(payload)
  if (!mapped?.data || typeof mapped.data !== 'object') {
    return mapped
  }

  const data = { ...mapped.data }

  Object.entries(entityMappers).forEach(([key, mapper]) => {
    if (data[key] != null && typeof mapper === 'function') {
      data[key] = mapper(data[key])
    }
  })

  return {
    ...mapped,
    data,
  }
}
