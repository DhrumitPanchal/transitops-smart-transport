import { ROLE_LABELS, ROLE_LANDING_ROUTES, ROLES } from '../constants/roles'
import { getPermissionsForRole } from '../constants/permissions'
import { STATUS_LABELS } from '../constants/statuses'
import { ROUTES } from '../constants/routes'
import { humanizeEnum } from './formatters'
import { isLicenseExpired, isLicenseExpiringSoon } from './dateHelpers'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function sleep(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isEmpty(value) {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function clone(value) {
  if (value == null || typeof value !== 'object') return value
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Fall through to JSON clone for non-cloneable values.
    }
  }
  return JSON.parse(JSON.stringify(value))
}

export function debounce(fn, wait = 300) {
  let timeoutId = null

  function debounced(...args) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      fn.apply(this, args)
    }, wait)
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  debounced.flush = (...args) => {
    debounced.cancel()
    return fn.apply(this, args)
  }

  return debounced
}

let idCounter = 0

export function createId(prefix = 'id') {
  idCounter += 1
  const random = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${random}_${idCounter}`
}

export function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function pick(object, keys = []) {
  if (!object || typeof object !== 'object') return {}
  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key]
    }
    return result
  }, {})
}

export function omit(object, keys = []) {
  if (!object || typeof object !== 'object') return {}
  const excluded = new Set(keys)
  return Object.keys(object).reduce((result, key) => {
    if (!excluded.has(key)) {
      result[key] = object[key]
    }
    return result
  }, {})
}

export function getInitials(name = '') {
  if (!name) return ''

  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Build a path from a route template.
 * Supports both `:id` and `[id]` Expo Router placeholders.
 */
export function buildPath(template, params = {}) {
  if (!template) return '/'

  return Object.entries(params).reduce((path, [key, value]) => {
    const encoded = encodeURIComponent(String(value))
    return path
      .replace(new RegExp(`:${key}(?=\\b|/|$)`, 'g'), encoded)
      .replace(new RegExp(`\\[${key}\\]`, 'g'), encoded)
  }, template)
}

/**
 * Normalize list payloads from mock (`data.items`) and API mappers (`data[]`).
 */
export function unwrapListResponse(response, fallbackPagination = {}) {
  const data = response?.data
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : []
  const pagination =
    response?.pagination || data?.pagination || fallbackPagination

  return { rows, pagination }
}

/**
 * Normalize detail payloads from mock (`data.item`) and API mappers (`data`).
 */
export function unwrapEntityResponse(response, nestedKeys = ['item']) {
  const data = response?.data
  if (data == null) return null

  for (const key of nestedKeys) {
    if (data[key] != null && typeof data[key] === 'object') {
      return data[key]
    }
  }

  if (data.id != null) return data
  return data
}

export function hasPermission(role, permission) {
  if (!role || !permission) return false
  const permissions = getPermissionsForRole(role)
  return permissions.includes(permission)
}

export function hasAnyPermission(role, permissions = []) {
  if (!role || !Array.isArray(permissions) || permissions.length === 0) {
    return false
  }

  return permissions.some((permission) => hasPermission(role, permission))
}

export function getRoleLandingRoute(role) {
  if (!role) return ROUTES.DASHBOARD
  return ROLE_LANDING_ROUTES[role] || ROUTES.DASHBOARD
}

export function getStatusLabel(status) {
  if (!status) return '—'
  return STATUS_LABELS[status] || humanizeEnum(status)
}

export function getRoleLabel(role) {
  if (!role) return 'Not assigned'
  return ROLE_LABELS[role] || humanizeEnum(role)
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role)
}

export { isLicenseExpired, isLicenseExpiringSoon }
