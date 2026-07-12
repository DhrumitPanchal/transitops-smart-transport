import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetReports } from '../mocks/repositories'

export async function getReports(params = {}) {
  if (env.useMocks) {
    return mockGetReports()
  }

  const { data } = await apiClient.get(ENDPOINTS.REPORTS.BASE, { params })
  return data
}
