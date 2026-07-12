function readEnv(key, fallback = '') {
  try {
    const value = process.env?.[key]
    if (value == null || value === '') return fallback
    return String(value)
  } catch {
    return fallback
  }
}

function toBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function toNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const APP_NAME = readEnv('EXPO_PUBLIC_APP_NAME', 'TransitOps')
export const API_BASE_URL = readEnv(
  'EXPO_PUBLIC_API_BASE_URL',
  'http://localhost:5000/api/v1',
)
export const SOCKET_URL = readEnv(
  'EXPO_PUBLIC_SOCKET_URL',
  'http://localhost:5000',
)
export const USE_MOCKS = toBoolean(readEnv('EXPO_PUBLIC_USE_MOCKS', 'true'), true)
export const ENABLE_REALTIME = toBoolean(
  readEnv('EXPO_PUBLIC_ENABLE_REALTIME', 'false'),
  false,
)
export const AUTH_MODE = readEnv('EXPO_PUBLIC_AUTH_MODE', 'bearer').toLowerCase()
export const REQUEST_TIMEOUT = toNumber(
  readEnv('EXPO_PUBLIC_REQUEST_TIMEOUT', '15000'),
  15000,
)
export const IS_DEV = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false

const env = {
  APP_NAME,
  API_BASE_URL,
  SOCKET_URL,
  USE_MOCKS,
  ENABLE_REALTIME,
  AUTH_MODE,
  REQUEST_TIMEOUT,
  IS_DEV,
  // camelCase aliases for services that mirror the website env shape
  appName: APP_NAME,
  apiBaseUrl: API_BASE_URL,
  socketUrl: SOCKET_URL,
  useMocks: USE_MOCKS,
  enableRealtime: ENABLE_REALTIME,
  authMode: AUTH_MODE,
  requestTimeout: REQUEST_TIMEOUT,
  isDev: IS_DEV,
}

export default env
