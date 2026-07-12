import { QUERY_KEYS } from '../../constants/queryKeys'
import { VEHICLE_STATUS } from '../../constants/statuses'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
  upsertItemById,
} from '../../realtime/realtimeCache'
import { doesVehicleMatchFilters } from './doesVehicleMatchFilters'

const COMPATIBLE_CREATE_SORTS = new Set([
  'registrationNumber',
  'vehicleName',
  'createdAt',
  'model',
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
      filters.vehicleType ||
      filters.status ||
      filters.region,
  )
}

function markDashboardAndReportsStale(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function syncVehicleAvailableCache(queryClient, vehicle) {
  if (!vehicle?.id) return

  queryClient.setQueryData(QUERY_KEYS.vehicles.available, (oldData) => {
    if (!oldData) {
      if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
        return oldData
      }

      return {
        data: [{ ...vehicle }],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      }
    }

    const currentItems = Array.isArray(oldData.data) ? oldData.data : []
    const withoutVehicle = removeItemById(currentItems, vehicle.id)
    const pageSize = Math.max(
      Number(oldData.pagination?.pageSize) || 10,
      withoutVehicle.length,
    )

    let nextItems = withoutVehicle
    if (vehicle.status === VEHICLE_STATUS.AVAILABLE) {
      nextItems = upsertItemById(withoutVehicle, vehicle).slice(0, pageSize)
    }

    return {
      ...oldData,
      data: nextItems,
      pagination: {
        ...oldData.pagination,
        page: 1,
        pageSize,
        totalItems: nextItems.length,
        totalPages: nextItems.length === 0 ? 0 : 1,
      },
    }
  })
}

export function setVehicleDetailCache(queryClient, vehicle) {
  if (!vehicle?.id) return

  queryClient.setQueryData(QUERY_KEYS.vehicles.detail(vehicle.id), (oldData) => {
    if (!oldData) {
      return { data: { ...vehicle } }
    }

    return updateSingleQueryData(oldData, vehicle)
  })
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

  if (oldData.data && Array.isArray(oldData.data.items)) {
    return {
      ...oldData,
      data: {
        ...oldData.data,
        pagination: {
          ...(oldData.data.pagination || oldData.pagination),
          totalItems,
          totalPages,
        },
      },
      pagination: oldData.pagination
        ? {
            ...oldData.pagination,
            totalItems,
            totalPages,
          }
        : oldData.pagination,
    }
  }

  return oldData
}

function canSafelyInsertCreatedVehicle(filters = {}) {
  const page = Number(filters.page) || 1
  if (page !== 1) return false

  const sortBy = filters.sortBy || 'registrationNumber'
  if (!COMPATIBLE_CREATE_SORTS.has(sortBy)) return false

  return true
}

function applyCreatedVehicleToLists(queryClient, vehicle) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.vehicles.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches = doesVehicleMatchFilters(vehicle, filters)

    if (matches && canSafelyInsertCreatedVehicle(filters)) {
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current

        const pageSize =
          current.pagination?.pageSize ||
          current.data?.pagination?.pageSize ||
          10

        const withItem = updatePaginatedQueryData(current, (items) => {
          const without = removeItemById(items, vehicle.id)
          return [vehicle, ...without].slice(0, pageSize)
        })

        return updateListPagination(withItem, 1)
      })
      return
    }

    markQueriesStaleWithoutRefetch(queryClient, queryKey)
  })
}

function applyUpdatedVehicleToLists(queryClient, vehicle) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.vehicles.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const items = Array.isArray(oldData.data)
      ? oldData.data
      : oldData.data?.items
    const existingIndex = Array.isArray(items)
      ? items.findIndex((entry) => String(entry?.id) === String(vehicle.id))
      : -1

    if (existingIndex >= 0) {
      const matches = doesVehicleMatchFilters(vehicle, filters)

      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current

        const next = updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) {
            return removeItemById(currentItems, vehicle.id)
          }
          return updateItemById(currentItems, vehicle)
        })

        if (!matches) {
          return updateListPagination(next, -1)
        }

        return next
      })
      return
    }

    if (hasActiveFilters(filters) && doesVehicleMatchFilters(vehicle, filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (!hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

/**
 * Applies a vehicle entity to TanStack Query caches after REST or socket updates.
 */
export function applyVehicleCacheUpdate(
  queryClient,
  vehicle,
  { isCreate = false } = {},
) {
  if (!queryClient || !vehicle?.id) return

  setVehicleDetailCache(queryClient, vehicle)

  if (isCreate) {
    applyCreatedVehicleToLists(queryClient, vehicle)
  } else {
    applyUpdatedVehicleToLists(queryClient, vehicle)
  }

  syncVehicleAvailableCache(queryClient, vehicle)
  markDashboardAndReportsStale(queryClient)
}

export function applyVehicleRetireToCache(queryClient, vehicle) {
  if (!queryClient || !vehicle?.id) return

  const retiredVehicle = {
    ...vehicle,
    status: VEHICLE_STATUS.RETIRED,
  }

  applyVehicleCacheUpdate(queryClient, retiredVehicle, { isCreate: false })
}
