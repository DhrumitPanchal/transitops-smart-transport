import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetFuelLogs } from '../mocks/repositories'

export async function getFuelLogs(params = {}) {
  if (env.useMocks) {
    return mockGetFuelLogs()
  }

  const { data } = await apiClient.get(ENDPOINTS.FUEL.BASE, { params })
  return data
}

export async function createFuelLog(payload) {
  const { data } = await apiClient.post(ENDPOINTS.FUEL.BASE, payload)
  return data
}
