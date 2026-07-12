import { ROLES } from '../../constants/roles'
import { getPermissionsForRole } from '../../constants/permissions'
import {
  DRIVER_STATUS,
  MAINTENANCE_STATUS,
  TRIP_STATUS,
  USER_STATUS,
  VEHICLE_STATUS,
} from '../../constants/statuses'
import {
  EXPENSE_TYPES,
  MAINTENANCE_TYPES,
  VEHICLE_TYPES,
} from '../../constants/appConstants'

export const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@transitops.com',
  role: ROLES.SUPER_ADMIN,
  status: USER_STATUS.ACTIVE,
  permissions: getPermissionsForRole(ROLES.SUPER_ADMIN),
}

export const mockVehicles = [
  {
    id: '1',
    registrationNumber: 'KA-01-AB-1234',
    make: 'Tata',
    model: 'Starbus',
    type: VEHICLE_TYPES.BUS,
    status: VEHICLE_STATUS.AVAILABLE,
    year: 2022,
  },
  {
    id: '2',
    registrationNumber: 'KA-02-CD-5678',
    make: 'Ashok Leyland',
    model: 'Viking',
    type: VEHICLE_TYPES.BUS,
    status: VEHICLE_STATUS.IN_SHOP,
    year: 2021,
  },
]

export const mockDrivers = [
  {
    id: '1',
    name: 'Ravi Kumar',
    licenseNumber: 'DL-2020-001',
    phone: '+91 98765 43210',
    status: DRIVER_STATUS.AVAILABLE,
  },
  {
    id: '2',
    name: 'Suresh Patel',
    licenseNumber: 'DL-2019-045',
    phone: '+91 98765 43211',
    status: DRIVER_STATUS.OFF_DUTY,
  },
]

export const mockTrips = [
  {
    id: '1',
    route: 'Depot A → City Center',
    vehicleId: '1',
    driverId: '1',
    status: TRIP_STATUS.DRAFT,
    scheduledAt: '2026-07-12T08:00:00Z',
  },
]

export const mockMaintenance = [
  {
    id: '1',
    vehicleId: '2',
    type: MAINTENANCE_TYPES.ROUTINE,
    status: MAINTENANCE_STATUS.IN_PROGRESS,
    scheduledDate: '2026-07-10',
  },
]

export const mockFuelLogs = [
  {
    id: '1',
    vehicleId: '1',
    liters: 45,
    cost: 4500,
    filledAt: '2026-07-11T10:00:00Z',
  },
]

export const mockExpenses = [
  {
    id: '1',
    category: EXPENSE_TYPES.TOLL,
    amount: 250,
    date: '2026-07-11',
  },
]

export const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@transitops.com',
    role: ROLES.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
  },
]

export const mockRoles = Object.values(ROLES).map((role, index) => ({
  id: String(index + 1),
  name: role,
  key: role,
  permissions: getPermissionsForRole(role),
}))

export const mockDashboardSummary = {
  totalVehicles: 2,
  activeDrivers: 1,
  tripsToday: 1,
  pendingMaintenance: 1,
  fuelCostThisMonth: 4500,
  expensesThisMonth: 250,
}
