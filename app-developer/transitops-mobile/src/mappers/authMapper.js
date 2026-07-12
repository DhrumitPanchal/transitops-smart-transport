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
 * Bearer mode may also include accessToken / refreshToken.
 */
export function fromApiSession(payload) {
  const mapped = fromApiEnvelope(payload)
  const rawData = mapped?.data && typeof mapped.data === 'object' ? mapped.data : {}
  const rawUser =
    rawData.user ??
    mapped?.user ??
    (mapped?.data && !mapped.data.user && !mapped.data.accessToken
      ? mapped.data
      : null)

  return {
    ...mapped,
    data: {
      ...rawData,
      user: userFromApi(rawUser),
      accessToken:
        rawData.accessToken ||
        rawData.access_token ||
        mapped?.accessToken ||
        null,
      refreshToken:
        rawData.refreshToken ||
        rawData.refresh_token ||
        mapped?.refreshToken ||
        null,
    },
  }
}

export function toApiRequest(payload) {
  return toApiBody(payload)
}

export function fromApiMe(payload) {
  return fromApiSession(payload)
}
