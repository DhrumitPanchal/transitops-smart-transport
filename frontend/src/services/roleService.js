import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetRoles } from '../mocks/repositories'

export async function getRoles(params = {}) {
  if (env.useMocks) {
    return mockGetRoles()
  }

  const { data } = await apiClient.get(ENDPOINTS.ROLES.BASE, { params })
  return data
}

export async function createRole(payload) {
  const { data } = await apiClient.post(ENDPOINTS.ROLES.BASE, payload)
  return data
}

export async function updateRole(id, payload) {
  const { data } = await apiClient.put(ENDPOINTS.ROLES.BY_ID(id), payload)
  return data
}
