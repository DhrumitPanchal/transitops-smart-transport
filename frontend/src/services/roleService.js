import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { roleMockRepository } from '../mocks/repositories/roleMockRepository'
import {
  fromApiDetail,
  fromApiList,
  toApiQuery,
  toApiRequest,
} from '../mappers/roleMapper'

export async function list(params = {}) {
  if (isMockMode()) {
    return roleMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.ROLES.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return roleMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.ROLES.BY_ID(id))
  return fromApiDetail(data)
}

export async function updatePermissions(id, permissions) {
  if (isMockMode()) {
    return roleMockRepository.updatePermissions(id, permissions)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.ROLES.PERMISSIONS(id),
    toApiRequest({ permissions }),
  )
  return fromApiDetail(data)
}
