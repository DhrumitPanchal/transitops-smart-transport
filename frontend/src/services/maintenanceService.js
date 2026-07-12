import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import {
  mockGetMaintenance,
  mockGetMaintenanceById,
} from '../mocks/repositories'

export async function getMaintenanceRecords(params = {}) {
  if (env.useMocks) {
    return mockGetMaintenance()
  }

  const { data } = await apiClient.get(ENDPOINTS.MAINTENANCE.BASE, { params })
  return data
}

export async function getMaintenanceById(id) {
  if (env.useMocks) {
    return mockGetMaintenanceById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.MAINTENANCE.BY_ID(id))
  return data
}

export async function createMaintenance(payload) {
  const { data } = await apiClient.post(ENDPOINTS.MAINTENANCE.BASE, payload)
  return data
}

export async function updateMaintenance(id, payload) {
  const { data } = await apiClient.put(ENDPOINTS.MAINTENANCE.BY_ID(id), payload)
  return data
}
