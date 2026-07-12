import { ApiError } from '../api/apiError'

let currentUser = null

export function getMockSessionUser() {
  return currentUser
}

export function setMockSessionUser(user) {
  currentUser = user
}

export function clearMockSession() {
  currentUser = null
}

export function requireMockSession() {
  if (!currentUser) {
    throw new ApiError('Unauthorized', 401)
  }
  return currentUser
}
