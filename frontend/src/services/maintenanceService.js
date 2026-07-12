import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { maintenanceMockRepository } from '../mocks/repositories/maintenanceMockRepository'

export async function list(params = {}) {
  if (isMockMode()) {
    return maintenanceMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.MAINTENANCE.BASE, { params })
  return data
}

export async function getById(id) {
  if (isMockMode()) {
    return maintenanceMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.MAINTENANCE.BY_ID(id))
  return data
}

export async function create(payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.create(payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.MAINTENANCE.BASE, payload)
  return data
}

export async function update(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(ENDPOINTS.MAINTENANCE.BY_ID(id), payload)
  return data
}

export async function complete(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.complete(id, payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.MAINTENANCE.COMPLETE(id),
    payload,
  )
  return data
}

export async function cancel(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.cancel(id, payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.MAINTENANCE.CANCEL(id),
    payload,
  )
  return data
}
