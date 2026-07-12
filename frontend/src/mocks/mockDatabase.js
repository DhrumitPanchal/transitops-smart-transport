import { ROLES } from '../constants/roles'
import { getPermissionsForRole, ALL_PERMISSIONS } from '../constants/permissions'
import {
  DRIVER_STATUS,
  MAINTENANCE_STATUS,
  TRIP_STATUS,
  USER_STATUS,
  VEHICLE_STATUS,
} from '../constants/statuses'
import {
  EXPENSE_TYPES,
  LICENCE_CATEGORIES,
  MAINTENANCE_TYPES,
  VEHICLE_TYPES,
} from '../constants/appConstants'
import { clone } from './mockHelpers'

function createSeed() {
  const roles = [
    {
      id: 'role_super_admin',
      key: ROLES.SUPER_ADMIN,
      name: 'Super Admin',
      description: 'Full platform access',
      permissions: [...ALL_PERMISSIONS],
    },
    {
      id: 'role_fleet_manager',
      key: ROLES.FLEET_MANAGER,
      name: 'Fleet Manager',
      description: 'Vehicles and maintenance',
      permissions: getPermissionsForRole(ROLES.FLEET_MANAGER),
    },
    {
      id: 'role_dispatcher',
      key: ROLES.DISPATCHER,
      name: 'Dispatcher',
      description: 'Trip operations',
      permissions: getPermissionsForRole(ROLES.DISPATCHER),
    },
    {
      id: 'role_safety_officer',
      key: ROLES.SAFETY_OFFICER,
      name: 'Safety Officer',
      description: 'Driver compliance',
      permissions: getPermissionsForRole(ROLES.SAFETY_OFFICER),
    },
    {
      id: 'role_financial_analyst',
      key: ROLES.FINANCIAL_ANALYST,
      name: 'Financial Analyst',
      description: 'Fuel, expenses and reports',
      permissions: getPermissionsForRole(ROLES.FINANCIAL_ANALYST),
    },
  ]

  const users = [
    {
      id: 'user_1',
      name: 'Priya Sharma',
      email: 'admin@transitops.com',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'user_2',
      name: 'Arjun Mehta',
      email: 'fleet@transitops.com',
      role: ROLES.FLEET_MANAGER,
      status: USER_STATUS.ACTIVE,
      createdAt: '2026-01-12T08:00:00.000Z',
      updatedAt: '2026-01-12T08:00:00.000Z',
    },
    {
      id: 'user_3',
      name: 'Neha Iyer',
      email: 'dispatcher@transitops.com',
      role: ROLES.DISPATCHER,
      status: USER_STATUS.ACTIVE,
      createdAt: '2026-01-14T08:00:00.000Z',
      updatedAt: '2026-01-14T08:00:00.000Z',
    },
    {
      id: 'user_4',
      name: 'Rahul Nair',
      email: 'safety@transitops.com',
      role: ROLES.SAFETY_OFFICER,
      status: USER_STATUS.ACTIVE,
      createdAt: '2026-01-16T08:00:00.000Z',
      updatedAt: '2026-01-16T08:00:00.000Z',
    },
    {
      id: 'user_5',
      name: 'Ananya Gupta',
      email: 'finance@transitops.com',
      role: ROLES.FINANCIAL_ANALYST,
      status: USER_STATUS.ACTIVE,
      createdAt: '2026-01-18T08:00:00.000Z',
      updatedAt: '2026-01-18T08:00:00.000Z',
    },
  ]

  /** Development-only credentials — never attached to public user payloads. */
  const credentials = [
    {
      userId: 'user_1',
      email: 'admin@transitops.com',
      password: 'Admin@123',
    },
    {
      userId: 'user_2',
      email: 'fleet@transitops.com',
      password: 'Fleet@123',
    },
    {
      userId: 'user_3',
      email: 'dispatcher@transitops.com',
      password: 'Dispatcher@123',
    },
    {
      userId: 'user_4',
      email: 'safety@transitops.com',
      password: 'Safety@123',
    },
    {
      userId: 'user_5',
      email: 'finance@transitops.com',
      password: 'Finance@123',
    },
  ]

  const vehicles = [
    {
      id: 'veh_1',
      registrationNumber: 'KA01AB1234',
      vehicleName: 'City Express 1',
      model: 'Starbus Ultra',
      vehicleType: VEHICLE_TYPES.BUS,
      maxLoadCapacity: 8000,
      odometer: 45200,
      acquisitionCost: 3200000,
      region: 'Bengaluru',
      status: VEHICLE_STATUS.ON_TRIP,
      createdAt: '2025-11-01T10:00:00.000Z',
    },
    {
      id: 'veh_2',
      registrationNumber: 'KA02CD5678',
      vehicleName: 'Depot Hauler',
      model: 'Eicher Pro',
      vehicleType: VEHICLE_TYPES.TRUCK,
      maxLoadCapacity: 12000,
      odometer: 78150,
      acquisitionCost: 2800000,
      region: 'Mysuru',
      status: VEHICLE_STATUS.AVAILABLE,
      createdAt: '2025-11-05T10:00:00.000Z',
    },
    {
      id: 'veh_3',
      registrationNumber: 'KA03EF9012',
      vehicleName: 'Airport Shuttle',
      model: 'Force Traveller',
      vehicleType: VEHICLE_TYPES.VAN,
      maxLoadCapacity: 2500,
      odometer: 22100,
      acquisitionCost: 1450000,
      region: 'Bengaluru',
      status: VEHICLE_STATUS.IN_SHOP,
      createdAt: '2025-12-01T10:00:00.000Z',
    },
    {
      id: 'veh_4',
      registrationNumber: 'KA04GH3456',
      vehicleName: 'Legacy Coach',
      model: 'Ashok Leyland Viking',
      vehicleType: VEHICLE_TYPES.BUS,
      maxLoadCapacity: 7500,
      odometer: 180400,
      acquisitionCost: 2100000,
      region: 'Hubballi',
      status: VEHICLE_STATUS.RETIRED,
      createdAt: '2024-06-01T10:00:00.000Z',
    },
  ]

  const drivers = [
    {
      id: 'drv_1',
      name: 'Ravi Kumar',
      licenseNumber: 'KA2020001',
      licenseCategory: LICENCE_CATEGORIES.HPMV,
      licenseExpiryDate: '2027-08-15',
      contactNumber: '+91 98765 43210',
      safetyScore: 92,
      status: DRIVER_STATUS.ON_TRIP,
      createdAt: '2025-10-01T09:00:00.000Z',
    },
    {
      id: 'drv_2',
      name: 'Suresh Patel',
      licenseNumber: 'KA2019045',
      licenseCategory: LICENCE_CATEGORIES.HTV,
      licenseExpiryDate: '2026-08-01',
      contactNumber: '+91 98765 43211',
      safetyScore: 88,
      status: DRIVER_STATUS.AVAILABLE,
      createdAt: '2025-10-05T09:00:00.000Z',
    },
    {
      id: 'drv_3',
      name: 'Imran Sheikh',
      licenseNumber: 'KA2018122',
      licenseCategory: LICENCE_CATEGORIES.PSV,
      licenseExpiryDate: '2025-01-10',
      contactNumber: '+91 98765 43212',
      safetyScore: 74,
      status: DRIVER_STATUS.OFF_DUTY,
      createdAt: '2025-10-10T09:00:00.000Z',
    },
    {
      id: 'drv_4',
      name: 'Vikram Das',
      licenseNumber: 'KA2021109',
      licenseCategory: LICENCE_CATEGORIES.HMV,
      licenseExpiryDate: '2028-03-01',
      contactNumber: '+91 98765 43213',
      safetyScore: 81,
      status: DRIVER_STATUS.SUSPENDED,
      createdAt: '2025-10-15T09:00:00.000Z',
    },
  ]

  const trips = [
    {
      id: 'trip_1',
      tripNumber: 'TRP-0001',
      source: 'Depot A',
      destination: 'City Center',
      vehicleId: 'veh_1',
      driverId: 'drv_1',
      cargoWeight: 3200,
      plannedDistance: 42,
      revenue: 8500,
      status: TRIP_STATUS.DISPATCHED,
      startOdometer: 45200,
      dispatchedAt: '2026-07-10T06:30:00.000Z',
      createdAt: '2026-07-10T06:00:00.000Z',
    },
    {
      id: 'trip_2',
      tripNumber: 'TRP-0002',
      source: 'Warehouse North',
      destination: 'Port Terminal',
      vehicleId: 'veh_2',
      driverId: 'drv_2',
      cargoWeight: 9000,
      plannedDistance: 110,
      revenue: 18500,
      status: TRIP_STATUS.COMPLETED,
      startOdometer: 78000,
      finalOdometer: 78150,
      fuelConsumed: 28,
      fuelCost: 2800,
      completedAt: '2026-07-08T18:00:00.000Z',
      createdAt: '2026-07-08T05:00:00.000Z',
    },
    {
      id: 'trip_3',
      tripNumber: 'TRP-0003',
      source: 'Mysuru Depot',
      destination: 'Bengaluru Hub',
      vehicleId: 'veh_2',
      driverId: 'drv_2',
      cargoWeight: 4500,
      plannedDistance: 150,
      revenue: 12000,
      status: TRIP_STATUS.DRAFT,
      startOdometer: 78150,
      createdAt: '2026-07-11T09:00:00.000Z',
    },
  ]

  const maintenanceLogs = [
    {
      id: 'mnt_1',
      vehicleId: 'veh_3',
      maintenanceType: MAINTENANCE_TYPES.CORRECTIVE,
      description: 'Brake system overhaul and pad replacement',
      startDate: '2026-07-09',
      expectedEndDate: '2026-07-14',
      cost: 18500,
      vendorName: 'AutoCare Hub',
      notes: 'Waiting for spare parts',
      status: MAINTENANCE_STATUS.IN_PROGRESS,
      createdAt: '2026-07-09T08:00:00.000Z',
    },
  ]

  const fuelLogs = [
    {
      id: 'fuel_1',
      vehicleId: 'veh_2',
      tripId: 'trip_2',
      liters: 45,
      cost: 4500,
      fuelDate: '2026-07-08',
      odometerReading: 78020,
      stationName: 'IOCL Hebbal',
      notes: 'Filled before dispatch',
      createdAt: '2026-07-08T05:30:00.000Z',
    },
    {
      id: 'fuel_2',
      vehicleId: 'veh_1',
      tripId: null,
      liters: 38,
      cost: 3800,
      fuelDate: '2026-07-11',
      odometerReading: 45180,
      stationName: 'BPCL Yelahanka',
      notes: '',
      createdAt: '2026-07-11T07:00:00.000Z',
    },
  ]

  const expenses = [
    {
      id: 'exp_1',
      vehicleId: 'veh_2',
      tripId: 'trip_2',
      expenseType: EXPENSE_TYPES.TOLL,
      amount: 450,
      expenseDate: '2026-07-08',
      description: 'Highway toll for north corridor',
      createdAt: '2026-07-08T20:00:00.000Z',
    },
    {
      id: 'exp_2',
      vehicleId: 'veh_1',
      tripId: null,
      expenseType: EXPENSE_TYPES.PARKING,
      amount: 200,
      expenseDate: '2026-07-11',
      description: 'Overnight depot parking',
      createdAt: '2026-07-11T21:00:00.000Z',
    },
  ]

  return {
    roles,
    users,
    credentials,
    vehicles,
    drivers,
    trips,
    maintenanceLogs,
    // Alias — same array reference used by existing repositories
    maintenance: maintenanceLogs,
    fuelLogs,
    expenses,
    currentUserId: null,
  }
}

const db = createSeed()

/**
 * Shared in-memory mock database for the current browser session.
 * Auth and user repositories must use this singleton — never private copies.
 */
export function getDb() {
  return db
}

export function resetDb() {
  const seed = createSeed()
  Object.keys(db).forEach((key) => {
    delete db[key]
  })
  Object.assign(db, seed)
}

export function getCredentialStore() {
  return db.credentials
}

export function findCredentialByEmail(email) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase()
  return db.credentials.find((item) => item.email === normalized) || null
}

export function upsertCredential({ userId, email, password }) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase()
  const existing = db.credentials.find(
    (item) =>
      item.userId === userId || item.email === normalized,
  )

  if (existing) {
    existing.userId = userId
    existing.email = normalized
    existing.password = String(password)
    return existing
  }

  const credential = {
    userId,
    email: normalized,
    password: String(password),
  }
  db.credentials.push(credential)
  return credential
}

export function syncCredentialEmail(userId, email) {
  const credential = db.credentials.find((item) => item.userId === userId)
  if (!credential) return
  credential.email = String(email || '')
    .trim()
    .toLowerCase()
}

export function getRolePermissions(roleKey) {
  const role = db.roles.find((item) => item.key === roleKey)
  return role ? [...role.permissions] : getPermissionsForRole(roleKey)
}

export function toPublicUser(user) {
  if (!user) return null

  const role = user.role || null
  const permissions =
    user.status === USER_STATUS.PENDING || !role
      ? []
      : getRolePermissions(role)

  return clone({
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    status: user.status,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || user.createdAt,
  })
}
