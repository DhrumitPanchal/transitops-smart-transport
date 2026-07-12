import { keysToSnakeCase } from './caseMapper'
import { mapSingleResponse, toApiBody } from './apiEnvelope'
import { fromApi as userFromApi } from './userMapper'

export function fromApi(entity) {
  return userFromApi(entity)
}

export function toApi(credentials) {
  if (credentials == null) return credentials
  return keysToSnakeCase(credentials)
}

export function fromApiSession(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function toApiRequest(payload) {
  return toApiBody(payload)
}

export function fromApiMe(payload) {
  return fromApiSession(payload)
}
