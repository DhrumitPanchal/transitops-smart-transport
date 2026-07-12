export const SOCKET_EVENTS = {
  VEHICLE_CREATED: 'vehicle.created',
  VEHICLE_UPDATED: 'vehicle.updated',
  VEHICLE_RETIRED: 'vehicle.retired',
  VEHICLE_STATUS_CHANGED: 'vehicle.status_changed',

  DRIVER_CREATED: 'driver.created',
  DRIVER_UPDATED: 'driver.updated',
  DRIVER_STATUS_CHANGED: 'driver.status_changed',

  TRIP_CREATED: 'trip.created',
  TRIP_UPDATED: 'trip.updated',
  TRIP_DISPATCHED: 'trip.dispatched',
  TRIP_COMPLETED: 'trip.completed',
  TRIP_CANCELLED: 'trip.cancelled',

  MAINTENANCE_CREATED: 'maintenance.created',
  MAINTENANCE_UPDATED: 'maintenance.updated',
  MAINTENANCE_COMPLETED: 'maintenance.completed',
  MAINTENANCE_CANCELLED: 'maintenance.cancelled',

  FUEL_CREATED: 'fuel.created',
  FUEL_UPDATED: 'fuel.updated',
  FUEL_DELETED: 'fuel.deleted',

  EXPENSE_CREATED: 'expense.created',
  EXPENSE_UPDATED: 'expense.updated',
  EXPENSE_DELETED: 'expense.deleted',

  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_STATUS_CHANGED: 'user.status_changed',

  ROLE_PERMISSIONS_UPDATED: 'role.permissions_updated',
}

export const REALTIME_STATUS = {
  DISABLED: 'disabled',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
}
