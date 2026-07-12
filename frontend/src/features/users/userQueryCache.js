import { QUERY_KEYS } from '../../constants/queryKeys'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
} from '../../realtime/realtimeCache'
import { doesUserMatchFilters } from './doesUserMatchFilters'

const COMPATIBLE_CREATE_SORTS = new Set(['name', 'email', 'createdAt', 'role', 'status'])

function extractListFilters(queryKey) {
  if (!Array.isArray(queryKey) || queryKey.length < 3) return {}
  const params = queryKey[2]
  if (!params || typeof params !== 'object' || Array.isArray(params)) return {}
  return params
}

function hasActiveFilters(filters = {}) {
  return Boolean(
    String(filters.search || '').trim() ||
      filters.status ||
      filters.role ||
      filters.dateFrom ||
      filters.dateTo,
  )
}

function updateListPagination(oldData, itemDelta) {
  if (!oldData?.pagination) return oldData
  const totalItems = Math.max(0, (oldData.pagination.totalItems || 0) + itemDelta)
  const pageSize = oldData.pagination.pageSize || 10
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
  if (Array.isArray(oldData.data)) {
    return {
      ...oldData,
      pagination: {
        ...oldData.pagination,
        totalItems,
        totalPages,
      },
    }
  }
  return oldData
}

function sanitizeUser(record) {
  if (!record) return record
  const next = { ...record }
  delete next.password
  delete next.confirmPassword
  delete next.passwordHash
  return next
}

export function setUserDetailCache(queryClient, record) {
  const user = sanitizeUser(record)
  if (!user?.id) return

  queryClient.setQueryData(QUERY_KEYS.users.detail(user.id), (oldData) => {
    if (!oldData) return { data: { ...user } }
    return updateSingleQueryData(oldData, user)
  })
}

function canSafelyInsertCreated(filters = {}) {
  const page = Number(filters.page) || 1
  if (page !== 1) return false
  const sortBy = filters.sortBy || 'name'
  return COMPATIBLE_CREATE_SORTS.has(sortBy)
}

function applyCreatedToLists(queryClient, record) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.users.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches = doesUserMatchFilters(record, filters)

    if (matches && canSafelyInsertCreated(filters)) {
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current
        const pageSize = current.pagination?.pageSize || 10
        const withItem = updatePaginatedQueryData(current, (items) => {
          const without = removeItemById(items, record.id)
          return [record, ...without].slice(0, pageSize)
        })
        return updateListPagination(withItem, 1)
      })
      return
    }

    markQueriesStaleWithoutRefetch(queryClient, queryKey)
  })
}

function applyUpdatedToLists(queryClient, record) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.users.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const items = Array.isArray(oldData.data) ? oldData.data : oldData.data?.items
    const existingIndex = Array.isArray(items)
      ? items.findIndex((entry) => String(entry?.id) === String(record.id))
      : -1

    if (existingIndex >= 0) {
      const matches = doesUserMatchFilters(record, filters)
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current
        const next = updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) return removeItemById(currentItems, record.id)
          return updateItemById(currentItems, record)
        })
        if (!matches) return updateListPagination(next, -1)
        return next
      })
      return
    }

    if (hasActiveFilters(filters) && doesUserMatchFilters(record, filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (!hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

export function applyUserCacheUpdate(
  queryClient,
  record,
  { isCreate = false } = {},
) {
  const user = sanitizeUser(record)
  if (!queryClient || !user?.id) return

  setUserDetailCache(queryClient, user)

  if (isCreate) {
    applyCreatedToLists(queryClient, user)
  } else {
    applyUpdatedToLists(queryClient, user)
  }
}

export function unwrapUserResponse(response) {
  const data = response?.data ?? response
  if (!data) return null
  return sanitizeUser(data.user || data)
}
