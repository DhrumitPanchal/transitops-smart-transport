export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
  },
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id) => `/vehicles/${id}`,
  },
  DRIVERS: {
    BASE: '/drivers',
    BY_ID: (id) => `/drivers/${id}`,
  },
  TRIPS: {
    BASE: '/trips',
    BY_ID: (id) => `/trips/${id}`,
  },
  MAINTENANCE: {
    BASE: '/maintenance',
    BY_ID: (id) => `/maintenance/${id}`,
  },
  FUEL: {
    BASE: '/fuel',
    BY_ID: (id) => `/fuel/${id}`,
  },
  EXPENSES: {
    BASE: '/expenses',
    BY_ID: (id) => `/expenses/${id}`,
  },
  REPORTS: {
    BASE: '/reports',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
  },
  ROLES: {
    BASE: '/roles',
    BY_ID: (id) => `/roles/${id}`,
  },
}
