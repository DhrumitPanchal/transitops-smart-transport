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
  return fromApiDetail(data)
}

export async function update(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.MAINTENANCE.BY_ID(id),
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function start(id) {
  if (isMockMode()) {
    return maintenanceMockRepository.start
      ? maintenanceMockRepository.start(id)
      : maintenanceMockRepository.update(id, { status: 'IN_PROGRESS' })
  }

  const { data } = await apiClient.patch(ENDPOINTS.MAINTENANCE.START(id))
  return fromApiDetail(data)
}

export async function complete(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.complete(id, payload)
  }

  const body = {
    actualCost: payload?.actualCost ?? payload?.cost,
    completedDate: payload?.completedDate ?? payload?.endDate,
    nextServiceOdometer: payload?.nextServiceOdometer,
    remarks: payload?.remarks ?? payload?.notes,
  }

  const { data } = await apiClient.patch(
    ENDPOINTS.MAINTENANCE.COMPLETE(id),
    body,
  )
  return fromApiDetail(data)
}

export async function cancel(id, payload) {
  if (isMockMode()) {
    return maintenanceMockRepository.cancel(id, payload)
  }

  const { data } = await apiClient.patch(ENDPOINTS.MAINTENANCE.CANCEL(id), {
    reason: payload?.reason || payload?.notes || 'Cancelled',
  })
  return fromApiDetail(data)
}
