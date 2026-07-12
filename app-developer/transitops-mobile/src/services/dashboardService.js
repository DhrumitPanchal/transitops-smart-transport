import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { dashboardMockRepository } from '../mocks/repositories/dashboardMockRepository'
import { fromApiSummary } from '../mappers/dashboardMapper'

export async function getSummary() {
  if (isMockMode()) {
    return dashboardMockRepository.getSummary()
  }

  const { data } = await apiClient.get(ENDPOINTS.DASHBOARD.SUMMARY)
  return fromApiSummary(data)
}
