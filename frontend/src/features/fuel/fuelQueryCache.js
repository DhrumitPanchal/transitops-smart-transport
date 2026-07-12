import { QUERY_KEYS } from '../../constants/queryKeys'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
} from '../../realtime/realtimeCache'
import { doesFuelLogMatchFilters } from './doesFuelLogMatchFilters'

const COMPATIBLE_CREATE_SORTS = new Set([
  'fuelDate',
  'createdAt',
  'cost',
  'liters',
  'odometerReading',
])

function extractListFilters(queryKey) {
  if (!Array.isArray(queryKey) || queryKey.length < 3) {
    return {}
  }

  const params = queryKey[2]
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {}
  }

  return params
}

function hasActiveFilters(filters = {}) {
  return Boolean(
    String(filters.search || '').trim() ||
      filters.vehicleId ||
      filters.tripId ||
      filters.dateFrom ||
      filters.dateTo,
  )
}

function markDashboardAndReportsStale(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
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

export function setFuelLogDetailCache(queryClient, record) {
  if (!record?.id) return

  queryClient.setQueryData(QUERY_KEYS.fuel.detail(record.id), (oldData) => {
    if (!oldData) {
      return { data: { ...record } }
    }
    return updateSingleQueryData(oldData, record)
  })
}

function canSafelyInsertCreated(filters = {}) {
  const page = Number(filters.page) || 1
  if (page !== 1) return false
  const sortBy = filters.sortBy || 'fuelDate'
  return COMPATIBLE_CREATE_SORTS.has(sortBy)
}

function applyCreatedToLists(queryClient, record) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.fuel.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches = doesFuelLogMatchFilters(record, filters)

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
    queryKey: QUERY_KEYS.fuel.lists,
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
      const matches = doesFuelLogMatchFilters(record, filters)

      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current

        const next = updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) {
            return removeItemById(currentItems, record.id)
          }
          return updateItemById(currentItems, record)
        })

        if (!matches) {
          return updateListPagination(next, -1)
        }

        return next
      })
      return
    }

    if (
      hasActiveFilters(filters) &&
      doesFuelLogMatchFilters(record, filters)
    ) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (!hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

function applyDeletedToLists(queryClient, id) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.fuel.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const items = Array.isArray(oldData.data) ? oldData.data : oldData.data?.items
    const existingIndex = Array.isArray(items)
      ? items.findIndex((entry) => String(entry?.id) === String(id))
      : -1

    if (existingIndex >= 0) {
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current
        const next = updatePaginatedQueryData(current, (currentItems) =>
          removeItemById(currentItems, id),
        )
        return updateListPagination(next, -1)
      })
      return
    }

    const filters = extractListFilters(queryKey)
    const page = Number(filters.page) || 1
    if (page > 1 || hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

export function applyFuelLogCacheUpdate(
  queryClient,
  record,
  { isCreate = false } = {},
) {
  if (!queryClient || !record?.id) return

  setFuelLogDetailCache(queryClient, record)

  if (isCreate) {
    applyCreatedToLists(queryClient, record)
  } else {
    applyUpdatedToLists(queryClient, record)
  }

  markDashboardAndReportsStale(queryClient)
}

export function applyFuelLogCacheDelete(queryClient, recordOrId) {
  if (!queryClient) return

  const id =
    typeof recordOrId === 'object' && recordOrId
      ? recordOrId.id
      : recordOrId

  if (!id) return

  queryClient.removeQueries({ queryKey: QUERY_KEYS.fuel.detail(id) })
  applyDeletedToLists(queryClient, id)
  markDashboardAndReportsStale(queryClient)
}

export function unwrapFuelLogResponse(response) {
  const data = response?.data ?? response
  if (!data) return null
  return data.fuelLog || data.fuel || data
}
