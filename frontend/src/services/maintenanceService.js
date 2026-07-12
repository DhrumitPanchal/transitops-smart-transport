import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { maintenanceMockRepository } from '../mocks/repositories/maintenanceMockRepository'
import {
  fromApiDetail,
  fromApiLifecycle,
  fromApiList,
  toApiQuery,
  toApiRequest,
} from '../mappers/maintenanceMapper'

export async function list(params = {}) {
  if (isMockMode()) {
    return maintenanceMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.MAINTENANCE.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return maintenanceMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.MAINTENANCE.BY_ID(id))
  return fromApiDetail(data)
}

export async function create(payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.create(payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.MAINTENANCE.BASE,
    toApiRequest(payload),
  )
  return fromApiLifecycle(data)
}

export async function update(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.MAINTENANCE.BY_ID(id),
    toApiRequest(payload),
  )
  return fromApiLifecycle(data)
}

export async function complete(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.complete(id, payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.MAINTENANCE.COMPLETE(id),
    toApiRequest(payload),
  )
  return fromApiLifecycle(data)
}

export async function cancel(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.cancel(id, payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.MAINTENANCE.CANCEL(id),
    toApiRequest(payload),
  )
  return fromApiLifecycle(data)
}
