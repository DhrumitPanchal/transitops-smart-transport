import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { ApiError } from '../api/apiError'
import { isMockMode } from './serviceMode'
import { authMockRepository } from '../mocks/repositories/authMockRepository'
import { fromApiSession, toApiRequest } from '../mappers/authMapper'

function notAvailableOnApi(action) {
  throw new ApiError({
    status: 501,
    code: 'NOT_IMPLEMENTED',
    message: `${action} is not available on the current backend API.`,
  })
}

/** Public registration — mock only (backend has no /auth/register). */
export async function register(payload) {
  if (isMockMode()) {
    return authMockRepository.register(payload)
  }
  return notAvailableOnApi('Register')
}

export async function login(credentials) {
  if (isMockMode()) {
    return authMockRepository.login(credentials)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.AUTH.LOGIN,
    toApiRequest(credentials),
  )
  return fromApiSession(data)
}

export async function logout() {
  if (isMockMode()) {
    return authMockRepository.logout()
  }

  const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGOUT)
  return data
}

export async function getCurrentUser() {
  if (isMockMode()) {
    return authMockRepository.getCurrentUser()
  }

  const { data } = await apiClient.get(ENDPOINTS.AUTH.ME)
  return fromApiSession(data)
}

export function getDemoAccounts() {
  if (!isMockMode()) return []
  return authMockRepository.getDemoAccounts()
}

/** Clears in-memory mock session only. No browser storage. */
export function clearMockSession() {
  if (!isMockMode()) return
  authMockRepository.clearSession()
}
