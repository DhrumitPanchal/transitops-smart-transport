import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { tripMockRepository } from '../mocks/repositories/tripMockRepository'

export async function list(params = {}) {
  if (isMockMode()) {
    return tripMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.TRIPS.BASE, { params })
  return data
}

export async function getById(id) {
  if (isMockMode()) {
    return tripMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.TRIPS.BY_ID(id))
  return data
}

export async function create(payload) {
  if (isMockMode()) {
    return tripMockRepository.create(payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.TRIPS.BASE, payload)
  return data
}

export async function updateDraft(id, payload) {
  if (isMockMode()) {
    return tripMockRepository.updateDraft(id, payload)
  }

  const { data } = await apiClient.put(ENDPOINTS.TRIPS.BY_ID(id), payload)
  return data
}

export async function dispatch(id) {
  if (isMockMode()) {
    return tripMockRepository.dispatch(id)
  }

  const { data } = await apiClient.post(ENDPOINTS.TRIPS.DISPATCH(id))
  return data
}

export async function complete(id, payload) {
  if (isMockMode()) {
    return tripMockRepository.complete(id, payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.TRIPS.COMPLETE(id), payload)
  return data
}

export async function cancel(id, payload) {
  if (isMockMode()) {
    return tripMockRepository.cancel(id, payload)
  }

  const { data } = await apiClient.post(ENDPOINTS.TRIPS.CANCEL(id), payload)
  return data
}
