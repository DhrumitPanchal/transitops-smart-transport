import { keysToCamelCase } from './caseMapper'

/**
 * Backend uses camelCase. Keep payloads as-is (no snake_case conversion).
 */
export function fromApiEnvelope(payload) {
  if (payload == null) return payload
  return keysToCamelCase(payload)
}

export function toApiBody(payload) {
  if (payload == null) return payload
  return payload
}

/**
 * Map frontend list params to backend query shape.
 * pageSize → limit, sortDirection → sortOrder
 */
export function toApiParams(params = {}) {
  if (!params || typeof params !== 'object') return params

  const next = { ...params }

  if (next.pageSize != null && next.limit == null) {
    next.limit = next.pageSize
  }
  delete next.pageSize

  if (next.sortDirection != null && next.sortOrder == null) {
    next.sortOrder = next.sortDirection
  }
  delete next.sortDirection

  Object.keys(next).forEach((key) => {
    if (next[key] === undefined || next[key] === '') {
      delete next[key]
    }
  })

  return next
}

export function fieldErrorsFromApi(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return null
  return keysToCamelCase(fieldErrors)
}

/**
 * Convert express-validator `details` array into a fieldErrors map.
 */
export function fieldErrorsFromDetails(details) {
  if (!Array.isArray(details) || details.length === 0) return null

  return details.reduce((acc, item) => {
    const field = item?.path || item?.param
    if (!field || acc[field]) return acc
    acc[field] = item.msg || item.message || 'Invalid value'
    return acc
  }, {})
}

function normalizePagination(pagination) {
  if (!pagination || typeof pagination !== 'object') return pagination

  return {
    ...pagination,
    page: pagination.page,
    pageSize: pagination.pageSize ?? pagination.limit,
    limit: pagination.limit ?? pagination.pageSize,
    totalItems: pagination.totalItems ?? pagination.totalRecords,
    totalRecords: pagination.totalRecords ?? pagination.totalItems,
    totalPages: pagination.totalPages,
  }
}

/**
 * Unwrap `{ data }` list/detail payloads after camelCase mapping.
 * Supports backend `{ data: { items, pagination } }` and mock `{ data: [] }`.
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

  const rawPagination =
    mapped.data?.pagination ?? mapped.pagination ?? undefined

  return {
    ...mapped,
    data: items.map((item) => mapItem(item)),
    pagination: normalizePagination(rawPagination),
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
