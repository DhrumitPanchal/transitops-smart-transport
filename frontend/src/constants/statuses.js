export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  IN_SHOP: 'IN_SHOP',
  RETIRED: 'RETIRED',
}

export const DRIVER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  OFF_DUTY: 'OFF_DUTY',
  SUSPENDED: 'SUSPENDED',
}

export const TRIP_STATUS = {
  DRAFT: 'DRAFT',
  DISPATCHED: 'DISPATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const MAINTENANCE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

/** @deprecated Use MAINTENANCE_STATUS.SCHEDULED — kept for mock migration compatibility */
export const MAINTENANCE_STATUS_OPEN_ALIAS = MAINTENANCE_STATUS.SCHEDULED

export const USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}

export const STATUS_LABELS = {
  [VEHICLE_STATUS.AVAILABLE]: 'Available',
  [VEHICLE_STATUS.ON_TRIP]: 'On Trip',
  [VEHICLE_STATUS.IN_SHOP]: 'In Shop',
  [VEHICLE_STATUS.RETIRED]: 'Retired',

  [DRIVER_STATUS.AVAILABLE]: 'Available',
  [DRIVER_STATUS.ON_TRIP]: 'On Trip',
  [DRIVER_STATUS.OFF_DUTY]: 'Off Duty',
  [DRIVER_STATUS.SUSPENDED]: 'Suspended',

  [TRIP_STATUS.DRAFT]: 'Draft',
  [TRIP_STATUS.DISPATCHED]: 'Dispatched',
  [TRIP_STATUS.IN_PROGRESS]: 'In Progress',
  [TRIP_STATUS.COMPLETED]: 'Completed',
  [TRIP_STATUS.CANCELLED]: 'Cancelled',

  [MAINTENANCE_STATUS.SCHEDULED]: 'Scheduled',
  [MAINTENANCE_STATUS.IN_PROGRESS]: 'In Progress',
  [MAINTENANCE_STATUS.COMPLETED]: 'Completed',
  [MAINTENANCE_STATUS.CANCELLED]: 'Cancelled',

  [USER_STATUS.PENDING]: 'Pending',
  [USER_STATUS.ACTIVE]: 'Active',
  [USER_STATUS.INACTIVE]: 'Inactive',
}

export const VEHICLE_STATUS_OPTIONS = Object.values(VEHICLE_STATUS).map(
  (value) => ({
    value,
    label: STATUS_LABELS[value],
  }),
)

export const DRIVER_STATUS_OPTIONS = Object.values(DRIVER_STATUS).map(
  (value) => ({
    value,
    label: STATUS_LABELS[value],
  }),
)

export const TRIP_STATUS_OPTIONS = Object.values(TRIP_STATUS).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

export const MAINTENANCE_STATUS_OPTIONS = Object.values(MAINTENANCE_STATUS).map(
  (value) => ({
    value,
    label: STATUS_LABELS[value],
  }),
)

export const USER_STATUS_OPTIONS = Object.values(USER_STATUS).map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

/** Backend UserStatus is ACTIVE | INACTIVE only. */
export const USER_STATUS_OPTIONS_API = USER_STATUS_OPTIONS.filter(
  (option) => option.value !== USER_STATUS.PENDING,
)
