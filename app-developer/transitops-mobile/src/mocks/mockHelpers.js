import { DEFAULT_PAGE_SIZE } from '../constants/appConstants'

export function createId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

export function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
}

/**
 * Throw a normalized API-style error object.
 * Callers catch by status / code / fieldErrors.
 */
export function throwMockError({
  status = 500,
  code = 'INTERNAL_ERROR',
  message = 'An unexpected error occurred',
  fieldErrors = null,
} = {}) {
  const error = new Error(message)
  error.name = 'ApiError'
  error.status = status
  error.code = code
  error.fieldErrors = fieldErrors
  throw error
}

export function paginateItems(items = [], query = {}) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(
    1,
    Number(query.pageSize) || DEFAULT_PAGE_SIZE,
  )
  const totalItems = items.length
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    success: true,
    data: {
      items: clone(slice),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    },
  }
}

export function singleResponse(item, message) {
  const response = {
    success: true,
    data: {
      item: clone(item),
    },
  }
  if (message) {
    response.message = message
  }
  return response
}

export function applySearch(items, query, fields = []) {
  const term = String(query?.search || '')
    .trim()
    .toLowerCase()

  if (!term) return items

  return items.filter((item) =>
    fields.some((field) =>
      String(item[field] ?? '')
        .toLowerCase()
        .includes(term),
    ),
  )
}

export function applySort(items, query, defaultKey = 'id') {
  const sortBy = query?.sortBy || defaultKey
  const sortDirection = query?.sortDirection === 'desc' ? 'desc' : 'asc'
  const sorted = [...items]

  sorted.sort((left, right) => {
    const a = left?.[sortBy]
    const b = right?.[sortBy]

    if (a == null && b == null) return 0
    if (a == null) return 1
    if (b == null) return -1

    if (typeof a === 'number' && typeof b === 'number') {
      return sortDirection === 'asc' ? a - b : b - a
    }

    const result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    })

    return sortDirection === 'asc' ? result : -result
  })

  return sorted
}
