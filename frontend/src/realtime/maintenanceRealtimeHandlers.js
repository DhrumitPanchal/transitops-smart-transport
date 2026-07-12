import { applyMaintenanceLifecycleToCache } from '../features/maintenance/maintenanceQueryCache'
import { shouldProcessRealtimeEvent } from './realtimeEventGuard'
import { SOCKET_EVENTS } from './socketEvents'

export { doesMaintenanceMatchFilters } from '../features/maintenance/doesMaintenanceMatchFilters'

function createGuardedHandler(queryClient, handler) {
  return (payload) => {
    if (!shouldProcessRealtimeEvent(payload?.eventId)) {
      return
    }
    handler(queryClient, payload)
  }
}

function extractPayload(payload) {
  const data = payload?.data || {}
  return {
    maintenance: data.maintenance || null,
    vehicle: data.vehicle || null,
  }
}

export function registerMaintenanceRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractPayload(payload)
    if (!maintenance) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance,
      vehicle,
      isCreate: true,
    })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractPayload(payload)
    if (!maintenance) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance,
      vehicle,
      isCreate: false,
    })
  })

  const onCompleted = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractPayload(payload)
    if (!maintenance) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance,
      vehicle,
      isCreate: false,
    })
  })

  const onCancelled = createGuardedHandler(queryClient, (client, payload) => {
    const { maintenance, vehicle } = extractPayload(payload)
    if (!maintenance) return
    applyMaintenanceLifecycleToCache(client, {
      maintenance,
      vehicle,
      isCreate: false,
    })
  })

  socket.on(SOCKET_EVENTS.MAINTENANCE_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.MAINTENANCE_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.MAINTENANCE_COMPLETED, onCompleted)
  socket.on(SOCKET_EVENTS.MAINTENANCE_CANCELLED, onCancelled)

  return () => {
    socket.off(SOCKET_EVENTS.MAINTENANCE_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.MAINTENANCE_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.MAINTENANCE_COMPLETED, onCompleted)
    socket.off(SOCKET_EVENTS.MAINTENANCE_CANCELLED, onCancelled)
  }
}
