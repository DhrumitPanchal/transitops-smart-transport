export const SOCKET_EVENTS = {
  VEHICLE_CREATED: 'vehicle.created',
  VEHICLE_UPDATED: 'vehicle.updated',
  VEHICLE_RETIRED: 'vehicle.retired',
  VEHICLE_STATUS_CHANGED: 'vehicle.status_changed',
  VEHICLE_DELETED: 'vehicle.deleted',

  DRIVER_CREATED: 'driver.created',
  DRIVER_UPDATED: 'driver.updated',
  DRIVER_STATUS_CHANGED: 'driver.status_changed',
  DRIVER_DELETED: 'driver.deleted',

  TRIP_CREATED: 'trip.created',
  TRIP_UPDATED: 'trip.updated',
  TRIP_DISPATCHED: 'trip.dispatched',
  TRIP_STARTED: 'trip.started',
  TRIP_COMPLETED: 'trip.completed',
  TRIP_CANCELLED: 'trip.cancelled',

  MAINTENANCE_CREATED: 'maintenance.created',
  MAINTENANCE_UPDATED: 'maintenance.updated',
  MAINTENANCE_STARTED: 'maintenance.started',
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
  AUTH_SESSION_CHANGED: 'auth.session_changed',

  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_PERMISSIONS_UPDATED: 'role.permissions_updated',
  ROLE_PERMISSIONS_CHANGED: 'role.permissions_changed',

  DASHBOARD_UPDATED: 'dashboard.updated',
  NOTIFICATION_CREATED: 'notification.created',

  SOCKET_ERROR: 'socket.error',
  UNAUTHORIZED: 'unauthorized',
}

export const REALTIME_STATUS = {
  DISABLED: 'disabled',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
}

export const SOCKET_CONNECTION_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
}
