import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { isMockMode } from './serviceMode'
import { expenseMockRepository } from '../mocks/repositories/expenseMockRepository'
import {
  fromApiDetail,
  fromApiList,
  toApiQuery,
  toApiRequest,
} from '../mappers/expenseMapper'

export async function list(params = {}) {
  if (isMockMode()) {
    return expenseMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.EXPENSES.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return expenseMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.EXPENSES.BY_ID(id))
  return fromApiDetail(data)
}

export async function create(payload) {
  if (isMockMode()) {
    return expenseMockRepository.create(payload)
  }

  const { data } = await apiClient.post(
    ENDPOINTS.EXPENSES.BASE,
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function update(id, payload) {
  if (isMockMode()) {
    return expenseMockRepository.update(id, payload)
  }

  const { data } = await apiClient.put(
    ENDPOINTS.EXPENSES.BY_ID(id),
    toApiRequest(payload),
  )
  return fromApiDetail(data)
}

export async function remove(id) {
  if (isMockMode()) {
    return expenseMockRepository.remove(id)
  }

  const { data } = await apiClient.delete(ENDPOINTS.EXPENSES.BY_ID(id))
  return fromApiDetail(data)
}
