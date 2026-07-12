import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetUsers } from '../mocks/repositories'

export async function getUsers(params = {}) {
  if (env.useMocks) {
    return mockGetUsers()
  }

  const { data } = await apiClient.get(ENDPOINTS.USERS.BASE, { params })
  return data
}

export async function createUser(payload) {
  const { data } = await apiClient.post(ENDPOINTS.USERS.BASE, payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.put(ENDPOINTS.USERS.BY_ID(id), payload)
  return data
}
