export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
  },
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id) => `/vehicles/${id}`,
    STATUS: (id) => `/vehicles/${id}/status`,
    AVAILABLE: '/vehicles',
  },
  DRIVERS: {
    BASE: '/drivers',
    BY_ID: (id) => `/drivers/${id}`,
    STATUS: (id) => `/drivers/${id}/status`,
    AVAILABLE: '/drivers',
  },
  MAINTENANCE: {
    BASE: '/maintenance',
    BY_ID: (id) => `/maintenance/${id}`,
    START: (id) => `/maintenance/${id}/start`,
    COMPLETE: (id) => `/maintenance/${id}/complete`,
    CANCEL: (id) => `/maintenance/${id}/cancel`,
  },
  TRIPS: {
    BASE: '/trips',
    BY_ID: (id) => `/trips/${id}`,
    DISPATCH: (id) => `/trips/${id}/dispatch`,
    START: (id) => `/trips/${id}/start`,
    COMPLETE: (id) => `/trips/${id}/complete`,
    CANCEL: (id) => `/trips/${id}/cancel`,
  },
  FUEL: {
    BASE: '/fuel-logs',
    BY_ID: (id) => `/fuel-logs/${id}`,
  },
  EXPENSES: {
    BASE: '/expenses',
    BY_ID: (id) => `/expenses/${id}`,
  },
  REPORTS: {
    SUMMARY: '/reports/summary',
    EXPORT: '/reports/export/csv',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
  },
  ROLES: {
    BASE: '/roles',
    BY_ID: (id) => `/roles/${id}`,
    PERMISSIONS: (id) => `/roles/${id}/permissions`,
    PERMISSIONS_CATALOG: '/roles/permissions',
  },
}
