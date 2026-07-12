export const QUERY_KEYS = {
  auth: {
    all: ['auth'],
    me: ['auth', 'me'],
  },

  vehicles: {
    all: ['vehicles'],
    lists: ['vehicles', 'list'],
    list: (params = {}) => ['vehicles', 'list', params],
    available: ['vehicles', 'available'],
    detail: (id) => ['vehicles', 'detail', String(id)],
  },

  drivers: {
    all: ['drivers'],
    lists: ['drivers', 'list'],
    list: (params = {}) => ['drivers', 'list', params],
    available: ['drivers', 'available'],
    detail: (id) => ['drivers', 'detail', String(id)],
  },

  trips: {
    all: ['trips'],
    lists: ['trips', 'list'],
    list: (params = {}) => ['trips', 'list', params],
    detail: (id) => ['trips', 'detail', String(id)],
  },

  maintenance: {
    all: ['maintenance'],
    lists: ['maintenance', 'list'],
    list: (params = {}) => ['maintenance', 'list', params],
    detail: (id) => ['maintenance', 'detail', String(id)],
  },

  fuel: {
    all: ['fuel'],
    lists: ['fuel', 'list'],
    list: (params = {}) => ['fuel', 'list', params],
    detail: (id) => ['fuel', 'detail', String(id)],
  },

  expenses: {
    all: ['expenses'],
    lists: ['expenses', 'list'],
    list: (params = {}) => ['expenses', 'list', params],
    detail: (id) => ['expenses', 'detail', String(id)],
  },

  dashboard: {
    all: ['dashboard'],
    summary: (filters = {}) => ['dashboard', 'summary', filters],
  },

  reports: {
    all: ['reports'],
    summary: (filters = {}) => ['reports', 'summary', filters],
  },

  users: {
    all: ['users'],
    lists: ['users', 'list'],
    list: (params = {}) => ['users', 'list', params],
    detail: (id) => ['users', 'detail', String(id)],
  },

  roles: {
    all: ['roles'],
    detail: (id) => ['roles', 'detail', String(id)],
  },
}
