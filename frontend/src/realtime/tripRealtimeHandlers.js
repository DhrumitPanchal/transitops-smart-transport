import { applyTripCacheUpdate, applyTripLifecycleToCache } from '../features/trips/tripQueryCache'
import { createGuardedHandler } from './createGuardedHandler'
import { SOCKET_EVENTS } from './socketEvents'

export { doesTripMatchFilters } from '../features/trips/doesTripMatchFilters'

function extractLifecyclePayload(payload) {
  const data = payload?.data || {}
  return {
    trip: data.trip || null,
    vehicle: data.vehicle || null,
    driver: data.driver || null,
    fuelLog: data.fuelLog || null,
  }
}

export function registerTripRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    const trip = payload?.data?.trip
    if (!trip) return
    applyTripCacheUpdate(client, trip, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const trip = payload?.data?.trip
    if (!trip) return
    applyTripCacheUpdate(client, trip, { isCreate: false })
  })

  const onDispatched = createGuardedHandler(queryClient, (client, payload) => {
    const { trip, vehicle, driver } = extractLifecyclePayload(payload)
    if (!trip) return
    applyTripLifecycleToCache(client, {
      trip,
      vehicle,
      driver,
      markReports: false,
    })
  })

  const onCompleted = createGuardedHandler(queryClient, (client, payload) => {
    const { trip, vehicle, driver, fuelLog } = extractLifecyclePayload(payload)
    if (!trip) return
    applyTripLifecycleToCache(client, {
      trip,
      vehicle,
      driver,
      fuelLog,
      markReports: true,
    })
  })

  const onCancelled = createGuardedHandler(queryClient, (client, payload) => {
    const { trip, vehicle, driver } = extractLifecyclePayload(payload)
    if (!trip) return
    applyTripLifecycleToCache(client, {
      trip,
      vehicle,
      driver,
      markReports: false,
    })
  })

  socket.on(SOCKET_EVENTS.TRIP_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.TRIP_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.TRIP_DISPATCHED, onDispatched)
  socket.on(SOCKET_EVENTS.TRIP_COMPLETED, onCompleted)
  socket.on(SOCKET_EVENTS.TRIP_CANCELLED, onCancelled)

  return () => {
    socket.off(SOCKET_EVENTS.TRIP_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.TRIP_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.TRIP_DISPATCHED, onDispatched)
    socket.off(SOCKET_EVENTS.TRIP_COMPLETED, onCompleted)
    socket.off(SOCKET_EVENTS.TRIP_CANCELLED, onCancelled)
  }
}
