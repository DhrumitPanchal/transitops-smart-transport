import { applyVehicleCacheUpdate } from '../features/vehicles/vehicleQueryCache'
import { shouldProcessRealtimeEvent } from './realtimeEventGuard'
import { SOCKET_EVENTS } from './socketEvents'

export { doesVehicleMatchFilters } from '../features/vehicles/doesVehicleMatchFilters'

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
    const vehicle = payload?.data?.vehicle
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = payload?.data?.vehicle
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: false })
  })

  const onRetired = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = payload?.data?.vehicle
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: false })
  })

  const onStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = payload?.data?.vehicle
    if (!vehicle) return
    applyVehicleCacheUpdate(client, vehicle, { isCreate: false })
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
