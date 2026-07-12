import { registerVehicleRealtimeHandlers } from './vehicleRealtimeHandlers'
import { registerDriverRealtimeHandlers } from './driverRealtimeHandlers'
import { registerTripRealtimeHandlers } from './tripRealtimeHandlers'
import { registerMaintenanceRealtimeHandlers } from './maintenanceRealtimeHandlers'
import { registerFuelRealtimeHandlers } from './fuelRealtimeHandlers'
import { registerExpenseRealtimeHandlers } from './expenseRealtimeHandlers'
import { registerDashboardRealtimeHandlers } from './dashboardRealtimeHandlers'
import { registerUserRealtimeHandlers } from './userRealtimeHandlers'
import { registerRoleRealtimeHandlers } from './roleRealtimeHandlers'

export { doesVehicleMatchFilters } from './vehicleRealtimeHandlers'
export { doesDriverMatchFilters } from './driverRealtimeHandlers'
export { doesTripMatchFilters } from './tripRealtimeHandlers'
export { doesMaintenanceMatchFilters } from './maintenanceRealtimeHandlers'
export { doesFuelLogMatchFilters } from './fuelRealtimeHandlers'
export { doesExpenseMatchFilters } from './expenseRealtimeHandlers'
export { doesUserMatchFilters } from './userRealtimeHandlers'

/**
 * Registers all central Socket.IO cache handlers once per connection.
 * Returns a cleanup function that removes every registered listener.
 */
export function registerRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) {
    return () => {}
  }

  const cleanups = [
    registerVehicleRealtimeHandlers(socket, queryClient),
    registerDriverRealtimeHandlers(socket, queryClient),
    registerTripRealtimeHandlers(socket, queryClient),
    registerMaintenanceRealtimeHandlers(socket, queryClient),
    registerFuelRealtimeHandlers(socket, queryClient),
    registerExpenseRealtimeHandlers(socket, queryClient),
    registerDashboardRealtimeHandlers(socket, queryClient),
    registerUserRealtimeHandlers(socket, queryClient),
    registerRoleRealtimeHandlers(socket, queryClient),
  ]

  return () => {
    cleanups.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })
  }
}
