import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import tokenManager from '../api/tokenManager'
import { AUTH_MODE } from '../config/env'
import { isMockMode } from './serviceMode'
import { authMockRepository } from '../mocks/repositories/authMockRepository'
import { resetDemoData } from '../mocks/mockDatabase'
import { fromApiSession, toApiRequest } from '../mappers/authMapper'

async function storeSessionTokens(session) {
  if (AUTH_MODE !== 'bearer') return

  const data = session?.data || session || {}
  const accessToken = data.accessToken || data.access_token || null
  const refreshToken = data.refreshToken || data.refresh_token || null

  if (accessToken || refreshToken) {
    await tokenManager.setTokens({ accessToken, refreshToken })
  }
}

export async function register(payload) {
  if (isMockMode()) {
    const session = await authMockRepository.register(payload)
    await storeSessionTokens(session)
    return session
  }

  const { data } = await apiClient.post(
    ENDPOINTS.AUTH.REGISTER,
    toApiRequest(payload),
  )
  const session = fromApiSession(data)
  await storeSessionTokens(session)
  return session
}

export async function login(credentials) {
  if (isMockMode()) {
    const session = await authMockRepository.login(credentials)
    await storeSessionTokens(session)
    return session
  }

  const { data } = await apiClient.post(
    ENDPOINTS.AUTH.LOGIN,
    toApiRequest(credentials),
  )
  const session = fromApiSession(data)
  await storeSessionTokens(session)
  return session
}

export async function logout() {
  try {
    if (isMockMode()) {
      return await authMockRepository.logout()
    }

    const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGOUT)
    return data
  } finally {
    await tokenManager.clearTokens()
  }
}

export async function getCurrentUser() {
  if (isMockMode()) {
    return authMockRepository.getCurrentUser()
  }

  const { data } = await apiClient.get(ENDPOINTS.AUTH.ME)
  return fromApiSession(data)
}

export async function refreshSession() {
  if (isMockMode()) {
    const session = await authMockRepository.refreshSession()
    await storeSessionTokens(session)
    return session
  }

  const refreshToken = await tokenManager.getRefreshToken()
  const { data } = await apiClient.post(ENDPOINTS.AUTH.REFRESH, {
    refreshToken,
  })
  const session = fromApiSession(data)
  await storeSessionTokens(session)
  return session
}

export function getDemoAccounts() {
  if (!isMockMode()) return []
  return authMockRepository.getDemoAccounts()
}

export function clearMockSession() {
  if (!isMockMode()) return
  authMockRepository.clearSession()
}

/** Development-only: clear AsyncStorage mock DB and reseed. */
export async function resetMockDemoData() {
  if (!isMockMode()) {
    return { success: false, message: 'Reset is only available in mock mode.' }
  }
  await tokenManager.clearTokens()
  authMockRepository.clearSession()
  return resetDemoData()
}
