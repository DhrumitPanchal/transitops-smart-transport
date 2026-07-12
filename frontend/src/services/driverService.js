import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { driverMockRepository } from '../mocks/repositories/driverMockRepository'

export async function list(params = {}) {
  if (isMockMode()) {
    return driverMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.BASE, { params })
  return data
}

export async function getById(id) {
  if (isMockMode()) {
    return driverMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.BY_ID(id))
  return data
}

export async function create(payload) {
  if (isMockMode()) {
    return driverMockRepository.create(payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.DRIVERS.BASE, payload)
  return data
}

export async function update(id, payload) {
  if (isMockMode()) {
    return driverMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(ENDPOINTS.DRIVERS.BY_ID(id), payload)
  return data
}

export async function changeStatus(id, status) {
  if (isMockMode()) {
    return driverMockRepository.changeStatus(id, status)
  }

  const { data } = await apiClient.patch(ENDPOINTS.DRIVERS.STATUS(id), {
    status,
  })
  return data
}

export async function suspend(id) {
  if (isMockMode()) {
    return driverMockRepository.suspend(id)
  }

  const { data } = await apiClient.patch(ENDPOINTS.DRIVERS.STATUS(id), {
    status: 'SUSPENDED',
  })
  return data
}

export async function getAvailable(params = {}) {
  if (isMockMode()) {
    return driverMockRepository.getAvailable(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.AVAILABLE, { params })
  return data
}
