import { QUERY_KEYS } from '../../constants/queryKeys'
import { DRIVER_STATUS } from '../../constants/statuses'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
  upsertItemById,
} from '../../realtime/realtimeCache'
import {
  doesDriverMatchFilters,
  isDriverDispatchAvailable,
} from './doesDriverMatchFilters'

const COMPATIBLE_CREATE_SORTS = new Set([
  'name',
  'licenseNumber',
  'createdAt',
  'safetyScore',
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
      filters.licenseCategory ||
      filters.licenseCondition,
  )
}

function markDashboardStale(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
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

export function syncDriverAvailableCache(queryClient, driver) {
  if (!driver?.id) return

  queryClient.setQueryData(QUERY_KEYS.drivers.available, (oldData) => {
    if (!oldData) {
      if (!isDriverDispatchAvailable(driver)) {
        return oldData
      }

      return {
        data: [{ ...driver }],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      }
    }

    const currentItems = Array.isArray(oldData.data) ? oldData.data : []
    const withoutDriver = removeItemById(currentItems, driver.id)
    const pageSize = Math.max(
      Number(oldData.pagination?.pageSize) || 10,
      withoutDriver.length,
    )

    let nextItems = withoutDriver
    if (isDriverDispatchAvailable(driver)) {
      nextItems = upsertItemById(withoutDriver, driver).slice(0, pageSize)
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

export function setDriverDetailCache(queryClient, driver) {
  if (!driver?.id) return

  queryClient.setQueryData(QUERY_KEYS.drivers.detail(driver.id), (oldData) => {
    if (!oldData) {
      return { data: { ...driver } }
    }

    return updateSingleQueryData(oldData, driver)
  })
}

function canSafelyInsertCreatedDriver(filters = {}) {
  const page = Number(filters.page) || 1
  if (page !== 1) return false

  const sortBy = filters.sortBy || 'name'
  return COMPATIBLE_CREATE_SORTS.has(sortBy)
}

function applyCreatedDriverToLists(queryClient, driver) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.drivers.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches = doesDriverMatchFilters(driver, filters)

    if (matches && canSafelyInsertCreatedDriver(filters)) {
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current

        const pageSize = current.pagination?.pageSize || 10
        const withItem = updatePaginatedQueryData(current, (items) => {
          const without = removeItemById(items, driver.id)
          return [driver, ...without].slice(0, pageSize)
        })

        return updateListPagination(withItem, 1)
      })
      return
    }

    markQueriesStaleWithoutRefetch(queryClient, queryKey)
  })
}

function applyUpdatedDriverToLists(queryClient, driver) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.drivers.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const items = Array.isArray(oldData.data) ? oldData.data : oldData.data?.items
    const existingIndex = Array.isArray(items)
      ? items.findIndex((entry) => String(entry?.id) === String(driver.id))
      : -1

    if (existingIndex >= 0) {
      const matches = doesDriverMatchFilters(driver, filters)

      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current

        const next = updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) {
            return removeItemById(currentItems, driver.id)
          }
          return updateItemById(currentItems, driver)
        })

        if (!matches) {
          return updateListPagination(next, -1)
        }

        return next
      })
      return
    }

    if (hasActiveFilters(filters) && doesDriverMatchFilters(driver, filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (!hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

export function applyDriverCacheUpdate(
  queryClient,
  driver,
  { isCreate = false } = {},
) {
  if (!queryClient || !driver?.id) return

  setDriverDetailCache(queryClient, driver)

  if (isCreate) {
    applyCreatedDriverToLists(queryClient, driver)
  } else {
    applyUpdatedDriverToLists(queryClient, driver)
  }

  syncDriverAvailableCache(queryClient, driver)
  markDashboardStale(queryClient)
}

export function applyDriverStatusToCache(queryClient, driver) {
  applyDriverCacheUpdate(queryClient, driver, { isCreate: false })
}

export function applyDriverSuspendToCache(queryClient, driver) {
  if (!driver?.id) return

  applyDriverCacheUpdate(
    queryClient,
    {
      ...driver,
      status: DRIVER_STATUS.SUSPENDED,
    },
    { isCreate: false },
  )
}
