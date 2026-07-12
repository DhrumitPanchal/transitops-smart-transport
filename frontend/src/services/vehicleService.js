import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetVehicleById, mockGetVehicles } from '../mocks/repositories'

export async function getVehicles(params = {}) {
  if (env.useMocks) {
    return mockGetVehicles()
  }

  const { data } = await apiClient.get(ENDPOINTS.VEHICLES.BASE, { params })
  return data
}

export async function getVehicleById(id) {
  if (env.useMocks) {
    return mockGetVehicleById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.VEHICLES.BY_ID(id))
  return data
}

export async function createVehicle(payload) {
  const { data } = await apiClient.post(ENDPOINTS.VEHICLES.BASE, payload)
  return data
}

export async function updateVehicle(id, payload) {
  const { data } = await apiClient.put(ENDPOINTS.VEHICLES.BY_ID(id), payload)
  return data
}

export async function deleteVehicle(id) {
  const { data } = await apiClient.delete(ENDPOINTS.VEHICLES.BY_ID(id))
  return data
}
