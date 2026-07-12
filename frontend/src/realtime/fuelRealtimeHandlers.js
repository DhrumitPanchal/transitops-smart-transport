import {
  applyFuelLogCacheDelete,
  applyFuelLogCacheUpdate,
  unwrapFuelLogResponse,
} from '../features/fuel/fuelQueryCache'
import { shouldProcessRealtimeEvent } from './realtimeEventGuard'
import { SOCKET_EVENTS } from './socketEvents'

export { doesFuelLogMatchFilters } from '../features/fuel/doesFuelLogMatchFilters'

function createGuardedHandler(queryClient, handler) {
  return (payload) => {
    if (!shouldProcessRealtimeEvent(payload?.eventId)) {
      return
    }
    handler(queryClient, payload)
  }
}

function extractRecord(payload) {
  const data = payload?.data
  if (!data) return null
  if (data.fuelLog || data.fuel) {
    return data.fuelLog || data.fuel
  }
  if (data.id) return data
  return null
}

function extractDeletedId(payload) {
  const data = payload?.data
  if (!data) return null
  if (typeof data === 'string' || typeof data === 'number') return data
  return data.id || data.fuelLog?.id || data.fuel?.id || null
}

export function registerFuelRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractRecord(payload) || unwrapFuelLogResponse(payload)
    if (!record?.id) return
    applyFuelLogCacheUpdate(client, record, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractRecord(payload) || unwrapFuelLogResponse(payload)
    if (!record?.id) return
    applyFuelLogCacheUpdate(client, record, { isCreate: false })
  })

  const onDeleted = createGuardedHandler(queryClient, (client, payload) => {
    const id = extractDeletedId(payload)
    if (!id) return
    applyFuelLogCacheDelete(client, id)
  })

  socket.on(SOCKET_EVENTS.FUEL_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.FUEL_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.FUEL_DELETED, onDeleted)

  return () => {
    socket.off(SOCKET_EVENTS.FUEL_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.FUEL_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.FUEL_DELETED, onDeleted)
  }
}
