import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetExpenses } from '../mocks/repositories'

export async function getExpenses(params = {}) {
  if (env.useMocks) {
    return mockGetExpenses()
  }

  const { data } = await apiClient.get(ENDPOINTS.EXPENSES.BASE, { params })
  return data
}

export async function createExpense(payload) {
  const { data } = await apiClient.post(ENDPOINTS.EXPENSES.BASE, payload)
  return data
}
