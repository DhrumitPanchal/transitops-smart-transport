import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetMe, mockLogin, mockLogout } from '../mocks/repositories'

export async function login(credentials) {
  if (env.useMocks) {
    return mockLogin(credentials)
  }

  const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials)
  return data
}

export async function logout() {
  if (env.useMocks) {
    return mockLogout()
  }

  const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGOUT)
  return data
}

export async function getCurrentUser() {
  if (env.useMocks) {
    return mockGetMe()
  }

  const { data } = await apiClient.get(ENDPOINTS.AUTH.ME)
  return data
}
