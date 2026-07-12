import { applyDriverCacheUpdate } from '../features/drivers/driverQueryCache'
import { createGuardedHandler } from './createGuardedHandler'
import { SOCKET_EVENTS } from './socketEvents'

export { doesDriverMatchFilters } from '../features/drivers/doesDriverMatchFilters'

export function registerDriverRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    const driver = payload?.data?.driver
    if (!driver) return
    applyDriverCacheUpdate(client, driver, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const driver = payload?.data?.driver
    if (!driver) return
    applyDriverCacheUpdate(client, driver, { isCreate: false })
  })

  const onStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    const driver = payload?.data?.driver
    if (!driver) return
    applyDriverCacheUpdate(client, driver, { isCreate: false })
  })

  socket.on(SOCKET_EVENTS.DRIVER_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.DRIVER_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, onStatusChanged)

  return () => {
    socket.off(SOCKET_EVENTS.DRIVER_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.DRIVER_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, onStatusChanged)
  }
}
