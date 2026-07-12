import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { driverMockRepository } from '../mocks/repositories/driverMockRepository'
import {
  fromApiDetail,
  fromApiList,
  toApiQuery,
  toApiRequest,
} from '../mappers/driverMapper'

export async function list(params = {}) {
  if (isMockMode()) {
    return driverMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return driverMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.BY_ID(id))
  return fromApiDetail(data)
}

export async function create(payload) {
  if (isMockMode()) {
    return driverMockRepository.create(payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.DRIVERS.BASE,
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function update(id, payload) {
  if (isMockMode()) {
    return driverMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.DRIVERS.BY_ID(id),
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function changeStatus(id, status) {
  if (isMockMode()) {
    return driverMockRepository.changeStatus(id, status)
  }

  const { data } = await apiClient.patch(
    ENDPOINTS.DRIVERS.STATUS(id),
    toApiRequest({ status }),
  )
  return fromApiDetail(data)
}

export async function suspend(id) {
  if (isMockMode()) {
    return driverMockRepository.suspend(id)
  }

  const { data } = await apiClient.patch(
    ENDPOINTS.DRIVERS.STATUS(id),
    toApiRequest({ status: 'SUSPENDED' }),
  )
  return fromApiDetail(data)
}

export async function getAvailable(params = {}) {
  if (isMockMode()) {
    return driverMockRepository.getAvailable(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.DRIVERS.AVAILABLE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}
