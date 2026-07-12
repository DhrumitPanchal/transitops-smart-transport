import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { roleMockRepository } from '../mocks/repositories/roleMockRepository'

export async function list(params = {}) {
  if (isMockMode()) {
    return roleMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.ROLES.BASE, { params })
  return data
}

export async function getById(id) {
  if (isMockMode()) {
    return roleMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.ROLES.BY_ID(id))
  return data
}

export async function updatePermissions(id, permissions) {
  if (isMockMode()) {
    return roleMockRepository.updatePermissions(id, permissions)
  }

  const { data } = await apiClient.put(ENDPOINTS.ROLES.PERMISSIONS(id), {
    permissions,
  })
  return data
}
