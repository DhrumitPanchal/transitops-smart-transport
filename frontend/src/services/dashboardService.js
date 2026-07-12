import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetDashboardSummary } from '../mocks/repositories'

export async function getDashboardSummary() {
  if (env.useMocks) {
    return mockGetDashboardSummary()
  }

  const { data } = await apiClient.get(ENDPOINTS.DASHBOARD.SUMMARY)
  return data
}
