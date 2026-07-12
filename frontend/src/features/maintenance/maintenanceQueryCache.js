import { QUERY_KEYS } from '../../constants/queryKeys'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
} from '../../realtime/realtimeCache'
import { applyVehicleCacheUpdate } from '../vehicles/vehicleQueryCache'
import { doesMaintenanceMatchFilters } from './doesMaintenanceMatchFilters'

const COMPATIBLE_CREATE_SORTS = new Set([
  'createdAt',
  'startDate',
  'expectedEndDate',
  'status',
  'maintenanceType',
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
      filters.status ||
      filters.maintenanceType ||
      filters.vehicleId ||
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

export function setMaintenanceDetailCache(queryClient, record) {
  if (!record?.id) return

  queryClient.setQueryData(QUERY_KEYS.maintenance.detail(record.id), (oldData) => {
    if (!oldData) {
      return { data: { ...record } }
    }
    return updateSingleQueryData(oldData, record)
  })
}

function canSafelyInsertCreated(filters = {}) {
  const page = Number(filters.page) || 1
  if (page !== 1) return false
  const sortBy = filters.sortBy || 'createdAt'
  return COMPATIBLE_CREATE_SORTS.has(sortBy)
}

function applyCreatedToLists(queryClient, record) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.maintenance.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches = doesMaintenanceMatchFilters(record, filters)

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
    queryKey: QUERY_KEYS.maintenance.lists,
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
      const matches = doesMaintenanceMatchFilters(record, filters)

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
      doesMaintenanceMatchFilters(record, filters)
    ) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (!hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

export function applyMaintenanceCacheUpdate(
  queryClient,
  record,
  { isCreate = false } = {},
) {
  if (!queryClient || !record?.id) return

  setMaintenanceDetailCache(queryClient, record)

  if (isCreate) {
    applyCreatedToLists(queryClient, record)
  } else {
    applyUpdatedToLists(queryClient, record)
  }

  markDashboardAndReportsStale(queryClient)
}

export function applyMaintenanceLifecycleToCache(
  queryClient,
  { maintenance, vehicle = null, isCreate = false } = {},
) {
  if (!queryClient || !maintenance?.id) return

  applyMaintenanceCacheUpdate(queryClient, maintenance, { isCreate })

  if (vehicle?.id) {
    applyVehicleCacheUpdate(queryClient, vehicle, { isCreate: false })
  }
}

export function unwrapMaintenanceMutationPayload(response) {
  const data = response?.data ?? response
  if (!data) {
    return { maintenance: null, vehicle: null }
  }

  if (data.maintenance) {
    return {
      maintenance: data.maintenance,
      vehicle: data.vehicle || null,
    }
  }

  return {
    maintenance: data,
    vehicle: data.vehicle || null,
  }
}
