import { applyVehicleCacheUpdate } from '../features/vehicles/vehicleQueryCache'
import { createGuardedHandler } from './createGuardedHandler'
import { SOCKET_EVENTS } from './socketEvents'
import { markQueriesStaleWithoutRefetch } from './realtimeCache'
import { QUERY_KEYS } from '../constants/queryKeys'

export { doesVehicleMatchFilters } from '../features/vehicles/doesVehicleMatchFilters'

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

  const onDeleted = createGuardedHandler(queryClient, (client, payload) => {
    const vehicle = payload?.data?.vehicle
    if (vehicle?.id) {
      applyVehicleCacheUpdate(client, { ...vehicle, isDeleted: true }, { isCreate: false })
    }
    markQueriesStaleWithoutRefetch(client, QUERY_KEYS.vehicles.all)
  })

  socket.on(SOCKET_EVENTS.VEHICLE_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.VEHICLE_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.VEHICLE_RETIRED, onRetired)
  socket.on(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, onStatusChanged)
  socket.on(SOCKET_EVENTS.VEHICLE_DELETED, onDeleted)

  return () => {
    socket.off(SOCKET_EVENTS.VEHICLE_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.VEHICLE_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.VEHICLE_RETIRED, onRetired)
    socket.off(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, onStatusChanged)
    socket.off(SOCKET_EVENTS.VEHICLE_DELETED, onDeleted)
  }
}
