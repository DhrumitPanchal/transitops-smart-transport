import { fromApiEnvelope, toApiBody } from './apiEnvelope'
import { fromApi as userFromApi } from './userMapper'

export function fromApi(entity) {
  return userFromApi(entity)
}

export function toApi(credentials) {
  if (credentials == null) return credentials
  return credentials
}

/**
 * Auth login/me envelope: `{ success, message, data: { user } }`
 */
export function fromApiSession(payload) {
  const mapped = fromApiEnvelope(payload)
  const rawUser =
    mapped?.data?.user ??
    mapped?.user ??
    (mapped?.data && !mapped.data.user ? mapped.data : null)

  return {
    ...mapped,
    data: {
      user: userFromApi(rawUser),
    },
  }
}

export function toApiRequest(payload) {
  return toApiBody(payload)
}

export function fromApiMe(payload) {
  return fromApiSession(payload)
}
