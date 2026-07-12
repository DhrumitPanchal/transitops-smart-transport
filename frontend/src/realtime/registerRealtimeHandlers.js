import { registerVehicleRealtimeHandlers } from './vehicleRealtimeHandlers'

export { doesVehicleMatchFilters } from './vehicleRealtimeHandlers'

/**
 * Registers all central Socket.IO cache handlers once per connection.
 * Returns a cleanup function that removes every registered listener.
 */
export function registerRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) {
    return () => {}
  }

  const cleanups = [registerVehicleRealtimeHandlers(socket, queryClient)]

  return () => {
    cleanups.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })
  }
}
