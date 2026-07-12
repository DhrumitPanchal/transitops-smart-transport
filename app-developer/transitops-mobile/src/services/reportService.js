import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { reportMockRepository } from '../mocks/repositories/reportMockRepository'
import { fromApiSummary, toApiQuery } from '../mappers/reportMapper'

export async function getSummary(params = {}) {
  if (isMockMode()) {
    return reportMockRepository.getSummary(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.REPORTS.SUMMARY, {
    params: toApiQuery(params),
  })
  return fromApiSummary(data)
}

export async function exportCsv(params = {}) {
  if (isMockMode()) {
    const response = await reportMockRepository.exportCsv(params)
    const payload = response?.data?.item ?? response?.data ?? response
    return {
      fileName: payload.fileName,
      contentType: payload.contentType,
      content: payload.content,
      generatedAt: payload.generatedAt,
    }
  }

  const response = await apiClient.get(ENDPOINTS.REPORTS.EXPORT, {
    params: toApiQuery(params),
    responseType: 'text',
  })

  const disposition = response.headers?.['content-disposition'] || ''
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition)
  const fileName = match
    ? decodeURIComponent(match[1].replace(/"/g, ''))
    : `transitops-report-${Date.now()}.csv`

  return {
    content: typeof response.data === 'string' ? response.data : String(response.data ?? ''),
    fileName,
    contentType: response.headers?.['content-type'] || 'text/csv',
  }
}
