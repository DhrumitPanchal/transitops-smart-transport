import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { tripMockRepository } from '../mocks/repositories/tripMockRepository'
import {
  fromApiDetail,
  fromApiLifecycle,
  fromApiList,
  toApiQuery,
  toApiRequest,
} from '../mappers/tripMapper'

export async function list(params = {}) {
  if (isMockMode()) {
    return tripMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.TRIPS.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return tripMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.TRIPS.BY_ID(id))
  return fromApiDetail(data)
}

export async function create(payload) {
  if (isMockMode()) {
    return tripMockRepository.create(payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.TRIPS.BASE,
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function updateDraft(id, payload) {
  if (isMockMode()) {
    return tripMockRepository.updateDraft(id, payload)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.TRIPS.BY_ID(id),
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function dispatch(id) {
  if (isMockMode()) {
    return tripMockRepository.dispatch(id)
  }

  const { data } = await apiClient.post(ENDPOINTS.TRIPS.DISPATCH(id))
  return fromApiLifecycle(data)
}

export async function complete(id, payload) {
  if (isMockMode()) {
    return tripMockRepository.complete(id, payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.TRIPS.COMPLETE(id),
    toApiRequest(payload),
  )
  return fromApiLifecycle(data)
}

export async function cancel(id, payload) {
  if (isMockMode()) {
    return tripMockRepository.cancel(id, payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.TRIPS.CANCEL(id),
    toApiRequest(payload),
  )
  return fromApiLifecycle(data)
}
