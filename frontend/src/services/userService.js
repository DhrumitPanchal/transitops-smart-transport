import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { ApiError } from '../api/apiError'
import { isMockMode } from './serviceMode'
import { userMockRepository } from '../mocks/repositories/userMockRepository'
import {
  fromApiDetail,
  fromApiList,
  toApiQuery,
} from '../mappers/userMapper'

function notAvailableOnApi(action) {
  throw new ApiError({
    status: 501,
    code: 'NOT_IMPLEMENTED',
    message: `${action} is not available on the current backend API.`,
  })
}

export async function list(params = {}) {
  if (isMockMode()) {
    return userMockRepository.list(params)
  }

  const { data } = await apiClient.get(ENDPOINTS.USERS.BASE, {
    params: toApiQuery(params),
  })
  return fromApiList(data)
}

export async function getById(id) {
  if (isMockMode()) {
    return userMockRepository.getById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.USERS.BY_ID(id))
  return fromApiDetail(data)
}

/** Mock only — backend has no POST /users. */
export async function create(payload) {
  if (isMockMode()) {
    return userMockRepository.create(payload)
  }
  return notAvailableOnApi('Create user')
}

/** Mock only — backend has no PUT /users/:id. */
export async function update(id, payload) {
  if (isMockMode()) {
    return userMockRepository.update(id, payload)
  }
  return notAvailableOnApi('Update user')
}

/** Mock only — backend has no PATCH /users/:id/status. */
export async function changeStatus(id, status) {
  if (isMockMode()) {
    return userMockRepository.changeStatus(id, status)
  }
  return notAvailableOnApi('Change user status')
}

/** Mock only — backend has no PATCH /users/:id/approve. */
export async function approve(id, payload) {
  if (isMockMode()) {
    return userMockRepository.approve(id, payload)
  }
  return notAvailableOnApi('Approve user')
}
