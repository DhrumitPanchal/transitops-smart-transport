import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { reportMockRepository } from '../mocks/repositories/reportMockRepository'

export async function getSummary(params = {}) {
  if (isMockMode()) {
    return reportMockRepository.getSummary(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.REPORTS.SUMMARY, { params })
  return data
}

export async function exportCsv(params = {}) {
  if (isMockMode()) {
    return reportMockRepository.exportCsv(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.REPORTS.EXPORT, { params })
  return data
}
