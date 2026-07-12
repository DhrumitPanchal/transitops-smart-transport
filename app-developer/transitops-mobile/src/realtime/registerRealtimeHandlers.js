import { SOCKET_EVENTS } from '../constants/socketEvents'
import { USER_STATUS } from '../constants/statuses'
import { fromApiEnvelope } from '../mappers/apiEnvelope'
import {
  applyAuthSessionUserUpdate,
  forceAuthSessionLogout,
  getAuthSessionUser,
} from '../context/authSessionBridge'
import { createGuardedHandler } from './createGuardedHandler'
import {
  applyDriverCacheUpdate,
  applyExpenseCacheDelete,
  applyExpenseCacheUpdate,
  applyFuelLogCacheDelete,
  applyFuelLogCacheUpdate,
  applyMaintenanceLifecycleToCache,
  applyOptionalDashboardChanges,
  applyRolePermissionsCacheUpdate,
  applyTripCacheUpdate,
  applyTripLifecycleToCache,
  applyUserCacheUpdate,
  applyVehicleCacheUpdate,
} from './realtimeCache'

function extractEntity(payload, keys = []) {
  const data = payload?.data
  if (!data) return null
  for (const key of keys) {
    if (data[key]) return data[key]
  }
  if (data.id) return data
  return null
}

function extractDeletedId(payload, nestedKeys = []) {
  const data = payload?.data
  if (!data) return null
  if (typeof data === 'string' || typeof data === 'number') return data
  for (const key of nestedKeys) {
    if (data[key]?.id != null) return data[key].id
  }
  return data.id || null
}

function extractLifecycle(payload) {
  const data = payload?.data || {}
  return {
    trip: data.trip || null,
    vehicle: data.vehicle || null,
    driver: data.driver || null,
    fuelLog: data.fuelLog || null,
    maintenance: data.maintenance || null,
  }
}

function syncCurrentUserFromEvent(user) {
  if (!user?.id) return

  const current = getAuthSessionUser()
  if (!current || String(current.id) !== String(user.id)) return

  if (user.status === USER_STATUS.INACTIVE) {
    forceAuthSessionLogout('inactive')
    return
  }

  applyAuthSessionUserUpdate({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
  })
}

function syncCurrentUserPermissions(role, permissions) {
  const current = getAuthSessionUser()
  if (!current?.role || !role) return

  const roleKey = role.key || role.code || role.name
  if (!roleKey || current.role !== roleKey) return

  applyAuthSessionUserUpdate({
    permissions: Array.isArray(permissions) ? [...permissions] : [],
  })
}

const appliedDeltaEventIds = new Set()
const MAX_DELTA_IDS = 500

function rememberDeltaEvent(eventId) {
  if (!eventId) return true
  const key = String(eventId)
  if (appliedDeltaEventIds.has(key)) return false
  appliedDeltaEventIds.add(key)
  if (appliedDeltaEventIds.size > MAX_DELTA_IDS) {
    const first = appliedDeltaEventIds.values().next().value
    appliedDeltaEventIds.delete(first)
  }
  return true
}

/**
 * Registers all central Socket.IO cache handlers once per connection.
 * NEVER calls APIs — only setQueryData / setQueriesData / invalidateQueries({ refetchType: 'none' }).
 * Returns a cleanup function that removes every registered listener.
 */
export function registerRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) {
    return () => {}
  }

  const onVehicleCreated = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = extractEntity(payload, ['vehicle'])
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: true })
  })

  const onVehicleUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = extractEntity(payload, ['vehicle'])
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: false })
  })

  const onVehicleRetired = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = extractEntity(payload, ['vehicle'])
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: false })
  })

  const onVehicleStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = extractEntity(payload, ['vehicle'])
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: false })
  })

  const onDriverCreated = createGuardedHandler(queryClient, (client, payload) => {
    const driver = extractEntity(payload, ['driver'])
    if (!driver) return
    applyDriverCacheUpdate(client, driver, { isCreate: true })
  })

  const onDriverUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const driver = extractEntity(payload, ['driver'])
    if (!driver) return
    applyDriverCacheUpdate(client, driver, { isCreate: false })
  })

  const onDriverStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    const driver = extractEntity(payload, ['driver'])
    if (!driver) return
    applyDriverCacheUpdate(client, driver, { isCreate: false })
  })

  const onTripCreated = createGuardedHandler(queryClient, (client, payload) => {
    const trip = extractEntity(payload, ['trip'])
    if (!trip) return
    applyTripCacheUpdate(client, trip, { isCreate: true })
  })

  const onTripUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const trip = extractEntity(payload, ['trip'])
    if (!trip) return
    applyTripCacheUpdate(client, trip, { isCreate: false })
  })

  const onTripDispatched = createGuardedHandler(queryClient, (client, payload) => {
    const { trip, vehicle, driver } = extractLifecycle(payload)
    if (!trip) return
    applyTripLifecycleToCache(client, { trip, vehicle, driver, markReports: false })
  })

  const onTripCompleted = createGuardedHandler(queryClient, (client, payload) => {
    const { trip, vehicle, driver, fuelLog } = extractLifecycle(payload)
    if (!trip) return
    applyTripLifecycleToCache(client, {
      trip,
      vehicle,
      driver,
      fuelLog,
      markReports: true,
    })
  })

  const onTripCancelled = createGuardedHandler(queryClient, (client, payload) => {
    const { trip, vehicle, driver } = extractLifecycle(payload)
    if (!trip) return
    applyTripLifecycleToCache(client, { trip, vehicle, driver, markReports: false })
  })

  const onMaintenanceCreated = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractLifecycle(payload)
    const record = maintenance || extractEntity(payload, ['maintenance'])
    if (!record) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance: record,
      vehicle,
      isCreate: true,
    })
  })

  const onMaintenanceUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractLifecycle(payload)
    const record = maintenance || extractEntity(payload, ['maintenance'])
    if (!record) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance: record,
      vehicle,
      isCreate: false,
    })
  })

  const onMaintenanceCompleted = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractLifecycle(payload)
    const record = maintenance || extractEntity(payload, ['maintenance'])
    if (!record) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance: record,
      vehicle,
      isCreate: false,
    })
  })

  const onMaintenanceCancelled = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractLifecycle(payload)
    const record = maintenance || extractEntity(payload, ['maintenance'])
    if (!record) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance: record,
      vehicle,
      isCreate: false,
    })
  })

  const onFuelCreated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractEntity(payload, ['fuelLog', 'fuel'])
    if (!record?.id) return
    applyFuelLogCacheUpdate(client, record, { isCreate: true })
  })

  const onFuelUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractEntity(payload, ['fuelLog', 'fuel'])
    if (!record?.id) return
    applyFuelLogCacheUpdate(client, record, { isCreate: false })
  })

  const onFuelDeleted = createGuardedHandler(queryClient, (client, payload) => {
    const id = extractDeletedId(payload, ['fuelLog', 'fuel'])
    if (!id) return
    applyFuelLogCacheDelete(client, id)
  })

  const onExpenseCreated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractEntity(payload, ['expense'])
    if (!record?.id) return
    applyExpenseCacheUpdate(client, record, { isCreate: true })
  })

  const onExpenseUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractEntity(payload, ['expense'])
    if (!record?.id) return
    applyExpenseCacheUpdate(client, record, { isCreate: false })
  })

  const onExpenseDeleted = createGuardedHandler(queryClient, (client, payload) => {
    const id = extractDeletedId(payload, ['expense'])
    if (!id) return
    applyExpenseCacheDelete(client, id)
  })

  const onUserCreated = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractEntity(payload, ['user'])
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: true })
  })

  const onUserUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractEntity(payload, ['user'])
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: false })
    syncCurrentUserFromEvent(user)
  })

  const onUserStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractEntity(payload, ['user'])
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: false })
    syncCurrentUserFromEvent(user)
  })

  const onUserAccountUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractEntity(payload, ['user'])
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: false })
    syncCurrentUserFromEvent(user)
  })

  const onUserAccountDeactivated = createGuardedHandler(queryClient, (_client, payload) => {
    const user = extractEntity(payload, ['user'])
    if (!user?.id) return
    const current = getAuthSessionUser()
    if (current && String(current.id) === String(user.id)) {
      forceAuthSessionLogout('deactivated')
    }
  })

  const onSessionChanged = createGuardedHandler(queryClient, (_client, payload) => {
    const user = extractEntity(payload, ['user'])
    if (!user?.id) return
    syncCurrentUserFromEvent(user)
  })

  const onRolePermissionsUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const data = payload?.data || {}
    const role = data.role || extractEntity(payload, ['role'])
    const permissions = Array.isArray(data.permissions)
      ? data.permissions
      : role?.permissions

    if (!role?.id) return

    const nextRole = {
      ...role,
      permissions: Array.isArray(permissions) ? permissions : role.permissions,
    }

    applyRolePermissionsCacheUpdate(client, nextRole)
    syncCurrentUserPermissions(nextRole, nextRole.permissions)
  })

  const onAnyDashboardDelta = (_eventName, payload) => {
    if (!payload || typeof payload !== 'object') return
    const normalized = fromApiEnvelope(payload)
    const hasChanges = Boolean(
      normalized.dashboardChanges || normalized.data?.dashboardChanges,
    )
    if (!hasChanges) return
    if (!rememberDeltaEvent(normalized.eventId)) return
    applyOptionalDashboardChanges(queryClient, normalized)
  }

  socket.on(SOCKET_EVENTS.VEHICLE_CREATED, onVehicleCreated)
  socket.on(SOCKET_EVENTS.VEHICLE_UPDATED, onVehicleUpdated)
  socket.on(SOCKET_EVENTS.VEHICLE_RETIRED, onVehicleRetired)
  socket.on(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, onVehicleStatusChanged)

  socket.on(SOCKET_EVENTS.DRIVER_CREATED, onDriverCreated)
  socket.on(SOCKET_EVENTS.DRIVER_UPDATED, onDriverUpdated)
  socket.on(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, onDriverStatusChanged)

  socket.on(SOCKET_EVENTS.TRIP_CREATED, onTripCreated)
  socket.on(SOCKET_EVENTS.TRIP_UPDATED, onTripUpdated)
  socket.on(SOCKET_EVENTS.TRIP_DISPATCHED, onTripDispatched)
  socket.on(SOCKET_EVENTS.TRIP_COMPLETED, onTripCompleted)
  socket.on(SOCKET_EVENTS.TRIP_CANCELLED, onTripCancelled)

  socket.on(SOCKET_EVENTS.MAINTENANCE_CREATED, onMaintenanceCreated)
  socket.on(SOCKET_EVENTS.MAINTENANCE_UPDATED, onMaintenanceUpdated)
  socket.on(SOCKET_EVENTS.MAINTENANCE_COMPLETED, onMaintenanceCompleted)
  socket.on(SOCKET_EVENTS.MAINTENANCE_CANCELLED, onMaintenanceCancelled)

  socket.on(SOCKET_EVENTS.FUEL_CREATED, onFuelCreated)
  socket.on(SOCKET_EVENTS.FUEL_UPDATED, onFuelUpdated)
  socket.on(SOCKET_EVENTS.FUEL_DELETED, onFuelDeleted)

  socket.on(SOCKET_EVENTS.EXPENSE_CREATED, onExpenseCreated)
  socket.on(SOCKET_EVENTS.EXPENSE_UPDATED, onExpenseUpdated)
  socket.on(SOCKET_EVENTS.EXPENSE_DELETED, onExpenseDeleted)

  socket.on(SOCKET_EVENTS.USER_CREATED, onUserCreated)
  socket.on(SOCKET_EVENTS.USER_UPDATED, onUserUpdated)
  socket.on(SOCKET_EVENTS.USER_STATUS_CHANGED, onUserStatusChanged)
  socket.on(SOCKET_EVENTS.USER_ACCOUNT_UPDATED, onUserAccountUpdated)
  socket.on(SOCKET_EVENTS.USER_ACCOUNT_DEACTIVATED, onUserAccountDeactivated)
  socket.on(SOCKET_EVENTS.AUTH_SESSION_CHANGED, onSessionChanged)

  socket.on(SOCKET_EVENTS.ROLE_PERMISSIONS_UPDATED, onRolePermissionsUpdated)

  if (typeof socket.onAny === 'function') {
    socket.onAny(onAnyDashboardDelta)
  }

  return () => {
    socket.off(SOCKET_EVENTS.VEHICLE_CREATED, onVehicleCreated)
    socket.off(SOCKET_EVENTS.VEHICLE_UPDATED, onVehicleUpdated)
    socket.off(SOCKET_EVENTS.VEHICLE_RETIRED, onVehicleRetired)
    socket.off(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, onVehicleStatusChanged)

    socket.off(SOCKET_EVENTS.DRIVER_CREATED, onDriverCreated)
    socket.off(SOCKET_EVENTS.DRIVER_UPDATED, onDriverUpdated)
    socket.off(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, onDriverStatusChanged)

    socket.off(SOCKET_EVENTS.TRIP_CREATED, onTripCreated)
    socket.off(SOCKET_EVENTS.TRIP_UPDATED, onTripUpdated)
    socket.off(SOCKET_EVENTS.TRIP_DISPATCHED, onTripDispatched)
    socket.off(SOCKET_EVENTS.TRIP_COMPLETED, onTripCompleted)
    socket.off(SOCKET_EVENTS.TRIP_CANCELLED, onTripCancelled)

    socket.off(SOCKET_EVENTS.MAINTENANCE_CREATED, onMaintenanceCreated)
    socket.off(SOCKET_EVENTS.MAINTENANCE_UPDATED, onMaintenanceUpdated)
    socket.off(SOCKET_EVENTS.MAINTENANCE_COMPLETED, onMaintenanceCompleted)
    socket.off(SOCKET_EVENTS.MAINTENANCE_CANCELLED, onMaintenanceCancelled)

    socket.off(SOCKET_EVENTS.FUEL_CREATED, onFuelCreated)
    socket.off(SOCKET_EVENTS.FUEL_UPDATED, onFuelUpdated)
    socket.off(SOCKET_EVENTS.FUEL_DELETED, onFuelDeleted)

    socket.off(SOCKET_EVENTS.EXPENSE_CREATED, onExpenseCreated)
    socket.off(SOCKET_EVENTS.EXPENSE_UPDATED, onExpenseUpdated)
    socket.off(SOCKET_EVENTS.EXPENSE_DELETED, onExpenseDeleted)

    socket.off(SOCKET_EVENTS.USER_CREATED, onUserCreated)
    socket.off(SOCKET_EVENTS.USER_UPDATED, onUserUpdated)
    socket.off(SOCKET_EVENTS.USER_STATUS_CHANGED, onUserStatusChanged)
    socket.off(SOCKET_EVENTS.USER_ACCOUNT_UPDATED, onUserAccountUpdated)
    socket.off(SOCKET_EVENTS.USER_ACCOUNT_DEACTIVATED, onUserAccountDeactivated)
    socket.off(SOCKET_EVENTS.AUTH_SESSION_CHANGED, onSessionChanged)

    socket.off(SOCKET_EVENTS.ROLE_PERMISSIONS_UPDATED, onRolePermissionsUpdated)

    if (typeof socket.offAny === 'function') {
      socket.offAny(onAnyDashboardDelta)
    }
  }
}
