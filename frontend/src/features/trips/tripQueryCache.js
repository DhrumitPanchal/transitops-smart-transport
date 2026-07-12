import { QUERY_KEYS } from '../../constants/queryKeys'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
} from '../../realtime/realtimeCache'
import { applyVehicleCacheUpdate } from '../vehicles/vehicleQueryCache'
import { applyDriverCacheUpdate } from '../drivers/driverQueryCache'
import { applyFuelLogCacheUpdate } from '../fuel/fuelQueryCache'
import { doesTripMatchFilters } from './doesTripMatchFilters'

const COMPATIBLE_CREATE_SORTS = new Set([
  'createdAt',
  'tripNumber',
  'source',
  'destination',
  'status',
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
      filters.vehicleId ||
      filters.driverId ||
      filters.dateFrom ||
      filters.dateTo,
  )
}

function markDashboardStale(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
}

function markDashboardAndReportsStale(queryClient) {
  markDashboardStale(queryClient)
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

export function setTripDetailCache(queryClient, trip) {
  if (!trip?.id) return

  queryClient.setQueryData(QUERY_KEYS.trips.detail(trip.id), (oldData) => {
    if (!oldData) {
      return { data: { ...trip } }
    }
    return updateSingleQueryData(oldData, trip)
  })
}

function canSafelyInsertCreatedTrip(filters = {}) {
  const page = Number(filters.page) || 1
  if (page !== 1) return false
  const sortBy = filters.sortBy || 'createdAt'
  return COMPATIBLE_CREATE_SORTS.has(sortBy)
}

function applyCreatedTripToLists(queryClient, trip) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.trips.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches = doesTripMatchFilters(trip, filters)

    if (matches && canSafelyInsertCreatedTrip(filters)) {
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current
        const pageSize = current.pagination?.pageSize || 10
        const withItem = updatePaginatedQueryData(current, (items) => {
          const without = removeItemById(items, trip.id)
          return [trip, ...without].slice(0, pageSize)
        })
        return updateListPagination(withItem, 1)
      })
      return
    }

    markQueriesStaleWithoutRefetch(queryClient, queryKey)
  })
}

function applyUpdatedTripToLists(queryClient, trip) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.trips.lists,
  })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const items = Array.isArray(oldData.data) ? oldData.data : oldData.data?.items
    const existingIndex = Array.isArray(items)
      ? items.findIndex((entry) => String(entry?.id) === String(trip.id))
      : -1

    if (existingIndex >= 0) {
      const matches = doesTripMatchFilters(trip, filters)

      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current

        const next = updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) {
            return removeItemById(currentItems, trip.id)
          }
          return updateItemById(currentItems, trip)
        })

        if (!matches) {
          return updateListPagination(next, -1)
        }

        return next
      })
      return
    }

    if (hasActiveFilters(filters) && doesTripMatchFilters(trip, filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (!hasActiveFilters(filters)) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    }
  })
}

function applyLinkedVehicle(queryClient, vehicle) {
  if (!vehicle?.id) return
  applyVehicleCacheUpdate(queryClient, vehicle, { isCreate: false })
}

function applyLinkedDriver(queryClient, driver) {
  if (!driver?.id) return
  applyDriverCacheUpdate(queryClient, driver, { isCreate: false })
}

export function applyTripCacheUpdate(
  queryClient,
  trip,
  { isCreate = false, markReports = false } = {},
) {
  if (!queryClient || !trip?.id) return

  setTripDetailCache(queryClient, trip)

  if (isCreate) {
    applyCreatedTripToLists(queryClient, trip)
  } else {
    applyUpdatedTripToLists(queryClient, trip)
  }

  if (markReports) {
    markDashboardAndReportsStale(queryClient)
  } else {
    markDashboardStale(queryClient)
  }
}

export function applyTripLifecycleToCache(
  queryClient,
  {
    trip,
    vehicle = null,
    driver = null,
    fuelLog = null,
    markReports = false,
  } = {},
) {
  if (!queryClient || !trip?.id) return

  applyTripCacheUpdate(queryClient, trip, {
    isCreate: false,
    markReports,
  })

  applyLinkedVehicle(queryClient, vehicle)
  applyLinkedDriver(queryClient, driver)

  if (fuelLog?.id) {
    applyFuelLogCacheUpdate(queryClient, fuelLog, { isCreate: true })
  }
}

export function applyTripCreateToCache(queryClient, trip) {
  applyTripCacheUpdate(queryClient, trip, { isCreate: true })
}

export function applyTripDispatchToCache(queryClient, payload) {
  const trip = payload?.trip || payload?.data?.trip || payload
  const vehicle = payload?.vehicle || payload?.data?.vehicle || trip?.vehicle
  const driver = payload?.driver || payload?.data?.driver || trip?.driver

  applyTripLifecycleToCache(queryClient, {
    trip,
    vehicle,
    driver,
    markReports: false,
  })
}

export function applyTripCompleteToCache(queryClient, payload) {
  const trip = payload?.trip || payload?.data?.trip || payload
  const vehicle = payload?.vehicle || payload?.data?.vehicle || trip?.vehicle
  const driver = payload?.driver || payload?.data?.driver || trip?.driver
  const fuelLog = payload?.fuelLog || payload?.data?.fuelLog || null

  applyTripLifecycleToCache(queryClient, {
    trip,
    vehicle,
    driver,
    fuelLog,
    markReports: true,
  })
}

export function applyTripCancelToCache(queryClient, payload) {
  const trip = payload?.trip || payload?.data?.trip || payload
  const vehicle = payload?.vehicle || payload?.data?.vehicle || null
  const driver = payload?.driver || payload?.data?.driver || null

  applyTripLifecycleToCache(queryClient, {
    trip,
    vehicle,
    driver,
    markReports: false,
  })
}
