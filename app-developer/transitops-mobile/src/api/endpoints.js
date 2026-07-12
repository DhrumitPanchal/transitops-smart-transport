export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
  },
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id) => `/vehicles/${id}`,
    RETIRE: (id) => `/vehicles/${id}/retire`,
    AVAILABLE: '/vehicles/available',
  },
  DRIVERS: {
    BASE: '/drivers',
    BY_ID: (id) => `/drivers/${id}`,
    STATUS: (id) => `/drivers/${id}/status`,
    AVAILABLE: '/drivers/available',
  },
  TRIPS: {
    BASE: '/trips',
    BY_ID: (id) => `/trips/${id}`,
    DISPATCH: (id) => `/trips/${id}/dispatch`,
    COMPLETE: (id) => `/trips/${id}/complete`,
    CANCEL: (id) => `/trips/${id}/cancel`,
  },
  MAINTENANCE: {
    BASE: '/maintenance',
    BY_ID: (id) => `/maintenance/${id}`,
    COMPLETE: (id) => `/maintenance/${id}/complete`,
    CANCEL: (id) => `/maintenance/${id}/cancel`,
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
    APPROVE: (id) => `/users/${id}/approve`,
    STATUS: (id) => `/users/${id}/status`,
  },
  ROLES: {
    BASE: '/roles',
    BY_ID: (id) => `/roles/${id}`,
    PERMISSIONS: (id) => `/roles/${id}/permissions`,
    PERMISSIONS_CATALOG: '/roles/permissions',
  },
}
