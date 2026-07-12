import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { vehicleMockRepository } from '../mocks/repositories/vehicleMockRepository'

export async function list(params = {}) {
  if (isMockMode()) {
    return vehicleMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.VEHICLES.BASE, { params })
  return data
}

export async function getById(id) {
  if (isMockMode()) {
    return vehicleMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.VEHICLES.BY_ID(id))
  return data
}

export async function create(payload) {
  if (isMockMode()) {
    return vehicleMockRepository.create(payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.VEHICLES.BASE, payload)
  return data
}

export async function update(id, payload) {
  if (isMockMode()) {
    return vehicleMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(ENDPOINTS.VEHICLES.BY_ID(id), payload)
  return data
}

export async function retire(id) {
  if (isMockMode()) {
    return vehicleMockRepository.retire(id)
  }

  const { data } = await apiClient.post(ENDPOINTS.VEHICLES.RETIRE(id))
  return data
}

export async function getAvailable(params = {}) {
  if (isMockMode()) {
    return vehicleMockRepository.getAvailable(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.VEHICLES.AVAILABLE, { params })
  return data
}
