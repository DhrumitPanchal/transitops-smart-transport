import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { fuelMockRepository } from '../mocks/repositories/fuelMockRepository'
import {
  fromApiDetail,
  fromApiList,
  toApiQuery,
  toApiRequest,
} from '../mappers/fuelMapper'

export async function list(params = {}) {
  if (isMockMode()) {
    return fuelMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.FUEL.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return fuelMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.FUEL.BY_ID(id))
  return fromApiDetail(data)
}

export async function create(payload) {
  if (isMockMode()) {
    return fuelMockRepository.create(payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.FUEL.BASE,
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function update(id, payload) {
  if (isMockMode()) {
    return fuelMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.FUEL.BY_ID(id),
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function remove(id) {
  if (isMockMode()) {
    return fuelMockRepository.remove(id)
  }

  const { data } = await apiClient.delete(ENDPOINTS.FUEL.BY_ID(id))
  return fromApiDetail(data)
}
