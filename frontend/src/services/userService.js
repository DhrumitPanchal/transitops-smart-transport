import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { userMockRepository } from '../mocks/repositories/userMockRepository'

export async function list(params = {}) {
  if (isMockMode()) {
    return userMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.USERS.BASE, { params })
  return data
}

export async function getById(id) {
  if (isMockMode()) {
    return userMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.USERS.BY_ID(id))
  return data
}

export async function create(payload) {
  if (isMockMode()) {
    return userMockRepository.create(payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.USERS.BASE, payload)
  return data
}

export async function update(id, payload) {
  if (isMockMode()) {
    return userMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(ENDPOINTS.USERS.BY_ID(id), payload)
  return data
}

export async function changeStatus(id, status) {
  if (isMockMode()) {
    return userMockRepository.changeStatus(id, status)
  }

  const { data } = await apiClient.patch(ENDPOINTS.USERS.STATUS(id), { status })
  return data
}
