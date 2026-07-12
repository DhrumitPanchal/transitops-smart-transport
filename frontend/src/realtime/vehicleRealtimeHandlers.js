import { QUERY_KEYS } from '../constants/queryKeys'
import { VEHICLE_STATUS } from '../constants/statuses'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
  upsertItemById,
} from './realtimeCache'
import { shouldProcessRealtimeEvent } from './realtimeEventGuard'
import { SOCKET_EVENTS } from './socketEvents'

const UNAVAILABLE_VEHICLE_STATUSES = new Set([
  VEHICLE_STATUS.ON_TRIP,
  VEHICLE_STATUS.IN_SHOP,
  VEHICLE_STATUS.RETIRED,
])

function normalizeSearch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function doesVehicleMatchFilters(vehicle, filters = {}) {
  if (!vehicle) return false

  const search = normalizeSearch(filters.search)
  if (search) {
    const haystack = [
      vehicle.registrationNumber,
      vehicle.vehicleName,
      vehicle.model,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.vehicleType && vehicle.vehicleType !== filters.vehicleType) {
    return false
  }

  if (filters.status && vehicle.status !== filters.status) {
    return false
  }

  if (filters.region && vehicle.region !== filters.region) {
    return false
  }

  return true
}

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
    normalizeSearch(filters.search) ||
      filters.vehicleType ||
      filters.status ||
      filters.region,
  )
}

function syncVehicleAvailableCache(queryClient, vehicle) {
  if (!vehicle?.id) return

  queryClient.setQueryData(QUERY_KEYS.vehicles.available, (oldData) => {
    if (!oldData) {
      if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
        return oldData
      }

      return {
        data: [vehicle],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      }
    }

    return updatePaginatedQueryData(oldData, (items) => {
      const withoutVehicle = removeItemById(items, vehicle.id)

      if (vehicle.status === VEHICLE_STATUS.AVAILABLE) {
        return upsertItemById(withoutVehicle, vehicle)
      }

      if (UNAVAILABLE_VEHICLE_STATUSES.has(vehicle.status)) {
        return withoutVehicle
      }

      return withoutVehicle
    })
  })
}

function updateVehicleDetailCache(queryClient, vehicle) {
  if (!vehicle?.id) return

  queryClient.setQueryData(QUERY_KEYS.vehicles.detail(vehicle.id), (oldData) =>
    updateSingleQueryData(oldData, vehicle),
  )
}

function updateExistingVehicleListRows(queryClient, vehicle) {
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

      queryClient.setQueryData(queryKey, (current) =>
        updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) {
            return removeItemById(currentItems, vehicle.id)
          }
          return updateItemById(currentItems, vehicle)
        }),
      )
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

function markDashboardAndReportsStale(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

function handleVehiclePayload(queryClient, payload, { isCreate = false } = {}) {
  const vehicle = payload?.data?.vehicle
  if (!vehicle?.id) return

  updateVehicleDetailCache(queryClient, vehicle)

  if (isCreate) {
    const listQueries = queryClient.getQueriesData({
      queryKey: QUERY_KEYS.vehicles.lists,
    })

    listQueries.forEach(([queryKey]) => {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
    })
  } else {
    updateExistingVehicleListRows(queryClient, vehicle)
  }

  syncVehicleAvailableCache(queryClient, vehicle)
  markDashboardAndReportsStale(queryClient)
}

function createGuardedHandler(queryClient, handler) {
  return (payload) => {
    if (!shouldProcessRealtimeEvent(payload?.eventId)) {
      return
    }

    handler(queryClient, payload)
  }
}

export function registerVehicleRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    handleVehiclePayload(client, payload, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    handleVehiclePayload(client, payload, { isCreate: false })
  })

  const onRetired = createGuardedHandler(queryClient, (client, payload) => {
    handleVehiclePayload(client, payload, { isCreate: false })
  })

  const onStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    handleVehiclePayload(client, payload, { isCreate: false })
  })

  socket.on(SOCKET_EVENTS.VEHICLE_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.VEHICLE_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.VEHICLE_RETIRED, onRetired)
  socket.on(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, onStatusChanged)

  return () => {
    socket.off(SOCKET_EVENTS.VEHICLE_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.VEHICLE_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.VEHICLE_RETIRED, onRetired)
    socket.off(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, onStatusChanged)
  }
}
