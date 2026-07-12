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
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const MAINTENANCE_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const USER_STATUS = {
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
  [TRIP_STATUS.COMPLETED]: 'Completed',
  [TRIP_STATUS.CANCELLED]: 'Cancelled',

  [MAINTENANCE_STATUS.OPEN]: 'Open',
  [MAINTENANCE_STATUS.IN_PROGRESS]: 'In Progress',
  [MAINTENANCE_STATUS.COMPLETED]: 'Completed',
  [MAINTENANCE_STATUS.CANCELLED]: 'Cancelled',

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
