import * as SecureStore from 'expo-secure-store'

const ACCESS_TOKEN_KEY = 'transitops.accessToken'
const REFRESH_TOKEN_KEY = 'transitops.refreshToken'

const memory = {
  accessToken: null,
  refreshToken: null,
}

async function setSecureItem(key, value) {
  if (value == null || value === '') {
    await SecureStore.deleteItemAsync(key)
    return
  }
  await SecureStore.setItemAsync(key, String(value))
}

async function getSecureItem(key) {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

export async function getAccessToken() {
  if (memory.accessToken) return memory.accessToken
  const token = await getSecureItem(ACCESS_TOKEN_KEY)
  memory.accessToken = token
  return token
}

export async function getRefreshToken() {
  if (memory.refreshToken) return memory.refreshToken
  const token = await getSecureItem(REFRESH_TOKEN_KEY)
  memory.refreshToken = token
  return token
}

export async function setTokens({ accessToken = null, refreshToken = null } = {}) {
  memory.accessToken = accessToken || null
  memory.refreshToken = refreshToken || null
  await Promise.all([
    setSecureItem(ACCESS_TOKEN_KEY, memory.accessToken),
    setSecureItem(REFRESH_TOKEN_KEY, memory.refreshToken),
  ])
}

export async function setAccessToken(accessToken) {
  memory.accessToken = accessToken || null
  await setSecureItem(ACCESS_TOKEN_KEY, memory.accessToken)
}

export async function setRefreshToken(refreshToken) {
  memory.refreshToken = refreshToken || null
  await setSecureItem(REFRESH_TOKEN_KEY, memory.refreshToken)
}

export async function clearTokens() {
  memory.accessToken = null
  memory.refreshToken = null
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined),
  ])
}

export async function hasTokens() {
  const accessToken = await getAccessToken()
  return Boolean(accessToken)
}

const tokenManager = {
  getAccessToken,
  getRefreshToken,
  setTokens,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  hasTokens,
}

export default tokenManager
