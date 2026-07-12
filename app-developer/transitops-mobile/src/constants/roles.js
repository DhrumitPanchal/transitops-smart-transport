import { ROUTES } from './routes'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  FLEET_MANAGER: 'FLEET_MANAGER',
  DISPATCHER: 'DISPATCHER',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  FINANCIAL_ANALYST: 'FINANCIAL_ANALYST',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.FLEET_MANAGER]: 'Fleet Manager',
  [ROLES.DISPATCHER]: 'Dispatcher',
  [ROLES.SAFETY_OFFICER]: 'Safety Officer',
  [ROLES.FINANCIAL_ANALYST]: 'Financial Analyst',
}

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: 'Manages users, roles and all modules',
  [ROLES.FLEET_MANAGER]: 'Manages vehicles and maintenance',
  [ROLES.DISPATCHER]: 'Creates and manages trips',
  [ROLES.SAFETY_OFFICER]: 'Manages driver compliance',
  [ROLES.FINANCIAL_ANALYST]: 'Manages fuel, expenses and reports',
}

export const ROLE_LANDING_ROUTES = {
  [ROLES.SUPER_ADMIN]: ROUTES.DASHBOARD,
  [ROLES.FLEET_MANAGER]: ROUTES.VEHICLES,
  [ROLES.DISPATCHER]: ROUTES.TRIPS,
  [ROLES.SAFETY_OFFICER]: ROUTES.DRIVERS,
  [ROLES.FINANCIAL_ANALYST]: ROUTES.REPORTS,
}

export const ROLE_OPTIONS = Object.values(ROLES).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}))
