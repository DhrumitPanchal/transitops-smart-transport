import { QUERY_KEYS } from '../constants/queryKeys'
import { DRIVER_STATUS, VEHICLE_STATUS } from '../constants/statuses'
import { isLicenseExpired } from '../utils/dateHelpers'

function cloneShallow(value) {
  if (Array.isArray(value)) return [...value]
  if (value && typeof value === 'object') return { ...value }
  return value
}

function getItemId(item) {
  if (!item || typeof item !== 'object') return undefined
  if (item.id != null) return String(item.id)
  if (item._id != null) return String(item._id)
  return undefined
}

export function upsertItemById(items = [], item) {
  const nextItem = cloneShallow(item)
  const itemId = getItemId(nextItem)
  if (!itemId) return [...items, nextItem]

  const index = items.findIndex((entry) => getItemId(entry) === itemId)
  if (index === -1) return [...items, nextItem]

  const nextItems = [...items]
  nextItems[index] = { ...items[index], ...nextItem }
  return nextItems
}

export function updateItemById(items = [], item) {
  const nextItem = cloneShallow(item)
  const itemId = getItemId(nextItem)
  if (!itemId) return [...items]

  const index = items.findIndex((entry) => getItemId(entry) === itemId)
  if (index === -1) return [...items]

  const nextItems = [...items]
  nextItems[index] = { ...items[index], ...nextItem }
  return nextItems
}

export function removeItemById(items = [], id) {
  const targetId = id == null ? undefined : String(id)
  if (!targetId) return [...items]
  return items.filter((entry) => getItemId(entry) !== targetId)
}

function getListItems(data) {
  if (!data || typeof data !== 'object') return null

  if (Array.isArray(data.data)) {
    return {
      shape: 'flat',
      items: data.data,
      pagination: data.pagination,
    }
  }

  if (data.data && typeof data.data === 'object' && Array.isArray(data.data.items)) {
    return {
      shape: 'nested',
      items: data.data.items,
      pagination: data.data.pagination ?? data.pagination,
    }
  }

  return null
}

function buildListData(oldData, shape, items, pagination) {
  if (shape === 'nested') {
    return {
      ...oldData,
      data: {
        ...oldData.data,
        items,
        pagination: pagination ?? oldData.data.pagination,
      },
    }
  }

  return {
    ...oldData,
    data: items,
    pagination: pagination ?? oldData.pagination,
  }
}

export function updatePaginatedQueryData(oldData, updater) {
  if (!oldData) return oldData

  const parsed = getListItems(oldData)
  if (!parsed) return oldData

  const nextItems = updater(parsed.items, parsed.pagination)
  if (!Array.isArray(nextItems)) return oldData

  return buildListData(oldData, parsed.shape, nextItems, parsed.pagination)
}

export function updateSingleQueryData(oldData, item) {
  if (!item) return oldData

  if (!oldData) {
    return { data: cloneShallow(item) }
  }

  if (oldData.data && typeof oldData.data === 'object' && !Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: {
        ...oldData.data,
        ...cloneShallow(item),
      },
    }
  }

  return {
    ...oldData,
    data: cloneShallow(item),
  }
}

export function markQueriesStaleWithoutRefetch(queryClient, queryKey) {
  if (!queryClient || !queryKey) return
  queryClient.invalidateQueries({
    queryKey,
    refetchType: 'none',
  })
}

export function getPaginatedItems(data) {
  const parsed = getListItems(data)
  return parsed ? parsed.items : []
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

function extractListFilters(queryKey) {
  if (!Array.isArray(queryKey) || queryKey.length < 3) return {}
  const params = queryKey[2]
  if (!params || typeof params !== 'object' || Array.isArray(params)) return {}
  return params
}

function patchListCaches(queryClient, listKey, item, { isCreate = false, matchesFilters } = {}) {
  const listQueries = queryClient.getQueriesData({ queryKey: listKey })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const filters = extractListFilters(queryKey)
    const matches =
      typeof matchesFilters === 'function' ? matchesFilters(item, filters) : true
    const items = getPaginatedItems(oldData)
    const existingIndex = items.findIndex(
      (entry) => String(entry?.id) === String(item.id),
    )
    const page = Number(filters.page) || 1

    if (isCreate) {
      if (matches && page === 1) {
        queryClient.setQueryData(queryKey, (current) => {
          if (!current) return current
          const pageSize = current.pagination?.pageSize || 10
          const withItem = updatePaginatedQueryData(current, (currentItems) => {
            const without = removeItemById(currentItems, item.id)
            return [item, ...without].slice(0, pageSize)
          })
          return updateListPagination(withItem, 1)
        })
        return
      }
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    if (existingIndex >= 0) {
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current
        const next = updatePaginatedQueryData(current, (currentItems) => {
          if (!matches) return removeItemById(currentItems, item.id)
          return updateItemById(currentItems, item)
        })
        if (!matches) return updateListPagination(next, -1)
        return next
      })
      return
    }

    markQueriesStaleWithoutRefetch(queryClient, queryKey)
  })
}

function patchDetailCache(queryClient, detailKey, item) {
  if (!item?.id) return
  queryClient.setQueryData(detailKey, (oldData) => {
    if (!oldData) return { data: { ...item } }
    return updateSingleQueryData(oldData, item)
  })
}

function removeFromListCaches(queryClient, listKey, id) {
  const listQueries = queryClient.getQueriesData({ queryKey: listKey })

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    const items = getPaginatedItems(oldData)
    const existingIndex = items.findIndex(
      (entry) => String(entry?.id) === String(id),
    )

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

    markQueriesStaleWithoutRefetch(queryClient, queryKey)
  })
}

export function isDriverDispatchAvailable(driver) {
  if (!driver) return false
  return (
    driver.status === DRIVER_STATUS.AVAILABLE &&
    !isLicenseExpired(driver.licenseExpiryDate)
  )
}

/** Keep available-vehicles cache in sync with vehicle status changes. */
export function syncVehicleAvailableCache(queryClient, vehicle) {
  if (!vehicle?.id) return

  queryClient.setQueryData(QUERY_KEYS.vehicles.available, (oldData) => {
    if (!oldData) {
      if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) return oldData
      return {
        data: [{ ...vehicle }],
        pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
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

/** Keep available-drivers cache in sync with driver status / licence changes. */
export function syncDriverAvailableCache(queryClient, driver) {
  if (!driver?.id) return

  queryClient.setQueryData(QUERY_KEYS.drivers.available, (oldData) => {
    if (!oldData) {
      if (!isDriverDispatchAvailable(driver)) return oldData
      return {
        data: [{ ...driver }],
        pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
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

export function applyVehicleCacheUpdate(queryClient, vehicle, { isCreate = false } = {}) {
  if (!queryClient || !vehicle?.id) return
  patchDetailCache(queryClient, QUERY_KEYS.vehicles.detail(vehicle.id), vehicle)
  patchListCaches(queryClient, QUERY_KEYS.vehicles.lists, vehicle, { isCreate })
  syncVehicleAvailableCache(queryClient, vehicle)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function applyDriverCacheUpdate(queryClient, driver, { isCreate = false } = {}) {
  if (!queryClient || !driver?.id) return
  patchDetailCache(queryClient, QUERY_KEYS.drivers.detail(driver.id), driver)
  patchListCaches(queryClient, QUERY_KEYS.drivers.lists, driver, { isCreate })
  syncDriverAvailableCache(queryClient, driver)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
}

export function applyTripCacheUpdate(queryClient, trip, { isCreate = false, markReports = false } = {}) {
  if (!queryClient || !trip?.id) return
  patchDetailCache(queryClient, QUERY_KEYS.trips.detail(trip.id), trip)
  patchListCaches(queryClient, QUERY_KEYS.trips.lists, trip, { isCreate })
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  if (markReports) {
    markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
  }
}

export function applyTripLifecycleToCache(
  queryClient,
  { trip, vehicle = null, driver = null, fuelLog = null, markReports = false } = {},
) {
  if (!queryClient || !trip?.id) return

  applyTripCacheUpdate(queryClient, trip, { isCreate: false, markReports })

  if (vehicle?.id) {
    applyVehicleCacheUpdate(queryClient, vehicle, { isCreate: false })
  }
  if (driver?.id) {
    applyDriverCacheUpdate(queryClient, driver, { isCreate: false })
  }
  if (fuelLog?.id) {
    applyFuelLogCacheUpdate(queryClient, fuelLog, { isCreate: true })
  }
}

export function applyMaintenanceCacheUpdate(
  queryClient,
  record,
  { isCreate = false } = {},
) {
  if (!queryClient || !record?.id) return
  patchDetailCache(queryClient, QUERY_KEYS.maintenance.detail(record.id), record)
  patchListCaches(queryClient, QUERY_KEYS.maintenance.lists, record, { isCreate })
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
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

export function applyFuelLogCacheUpdate(queryClient, record, { isCreate = false } = {}) {
  if (!queryClient || !record?.id) return
  patchDetailCache(queryClient, QUERY_KEYS.fuel.detail(record.id), record)
  patchListCaches(queryClient, QUERY_KEYS.fuel.lists, record, { isCreate })
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function applyFuelLogCacheDelete(queryClient, recordOrId) {
  if (!queryClient) return
  const id =
    typeof recordOrId === 'object' && recordOrId ? recordOrId.id : recordOrId
  if (!id) return
  queryClient.removeQueries({ queryKey: QUERY_KEYS.fuel.detail(id) })
  removeFromListCaches(queryClient, QUERY_KEYS.fuel.lists, id)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function applyExpenseCacheUpdate(queryClient, record, { isCreate = false } = {}) {
  if (!queryClient || !record?.id) return
  patchDetailCache(queryClient, QUERY_KEYS.expenses.detail(record.id), record)
  patchListCaches(queryClient, QUERY_KEYS.expenses.lists, record, { isCreate })
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function applyExpenseCacheDelete(queryClient, recordOrId) {
  if (!queryClient) return
  const id =
    typeof recordOrId === 'object' && recordOrId ? recordOrId.id : recordOrId
  if (!id) return
  queryClient.removeQueries({ queryKey: QUERY_KEYS.expenses.detail(id) })
  removeFromListCaches(queryClient, QUERY_KEYS.expenses.lists, id)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function applyUserCacheUpdate(queryClient, record, { isCreate = false } = {}) {
  if (!queryClient || !record?.id) return
  const user = cloneShallow(record)
  delete user.password
  delete user.confirmPassword
  delete user.passwordHash
  patchDetailCache(queryClient, QUERY_KEYS.users.detail(user.id), user)
  patchListCaches(queryClient, QUERY_KEYS.users.lists, user, { isCreate })
}

export function applyRolePermissionsCacheUpdate(queryClient, role) {
  if (!queryClient || !role?.id) return
  const nextRole = {
    ...role,
    permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
  }
  patchDetailCache(queryClient, QUERY_KEYS.roles.detail(nextRole.id), nextRole)
  patchListCaches(queryClient, QUERY_KEYS.roles.lists, nextRole, { isCreate: false })
}

const SAFE_KPI_DELTA_KEYS = new Set([
  'activeVehicles',
  'availableVehicles',
  'vehiclesOnTrip',
  'vehiclesInMaintenance',
  'activeTrips',
  'pendingTrips',
  'driversOnDuty',
  'availableDrivers',
  'fleetUtilization',
  'totalOperationalCost',
  'fuelCost',
  'maintenanceCost',
  'expenses',
  'revenue',
  'vehicleRoi',
  'fuelEfficiency',
  'expiredLicences',
  'expiringLicences',
  'suspendedDrivers',
  'averageSafetyScore',
])

export function applyOptionalDashboardChanges(queryClient, payload) {
  if (!queryClient || !payload) return false

  const changes =
    payload.dashboardChanges ||
    payload.data?.dashboardChanges ||
    null

  if (!changes || typeof changes !== 'object') return false

  const queries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.dashboard.all,
  })

  let applied = false

  queries.forEach(([queryKey, oldData]) => {
    if (!oldData?.data?.kpis) return

    let changed = false
    const nextKpis = { ...oldData.data.kpis }

    Object.entries(changes).forEach(([key, delta]) => {
      if (!SAFE_KPI_DELTA_KEYS.has(key)) return
      const amount = Number(delta)
      if (!Number.isFinite(amount) || amount === 0) return
      const current = Number(nextKpis[key] ?? 0)
      if (!Number.isFinite(current)) return
      nextKpis[key] = Math.round((current + amount) * 100) / 100
      changed = true
    })

    if (!changed) return

    queryClient.setQueryData(queryKey, {
      ...oldData,
      data: {
        ...oldData.data,
        kpis: nextKpis,
      },
    })
    applied = true
  })

  return applied
}
