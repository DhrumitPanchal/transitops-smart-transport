import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetDriverById, mockGetDrivers } from '../mocks/repositories'

export async function getDrivers(params = {}) {
  if (env.useMocks) {
    return mockGetDrivers()
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.BASE, { params })
  return data
}

export async function getDriverById(id) {
  if (env.useMocks) {
    return mockGetDriverById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.BY_ID(id))
  return data
}

export async function createDriver(payload) {
  const { data } = await apiClient.post(ENDPOINTS.DRIVERS.BASE, payload)
  return data
}

export async function updateDriver(id, payload) {
  const { data } = await apiClient.put(ENDPOINTS.DRIVERS.BY_ID(id), payload)
  return data
}

export async function deleteDriver(id) {
  const { data } = await apiClient.delete(ENDPOINTS.DRIVERS.BY_ID(id))
  return data
}
