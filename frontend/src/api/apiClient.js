import axios from 'axios'
import env from '../config/env'
import { ApiError } from './apiError'
import { fieldErrorsFromApi } from '../mappers/apiEnvelope'
import { getSocketId } from '../realtime/socketClient'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const socketId = getSocketId()
  const headers = config.headers || {}

  if (socketId) {
    headers['X-Socket-ID'] = socketId
  } else if (typeof headers.delete === 'function') {
    headers.delete('X-Socket-ID')
  } else {
    delete headers['X-Socket-ID']
  }

  config.headers = headers
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 500
    const payload = error.response?.data || {}
    const rawMessage = payload.message || error.message || 'Request failed'
    const message =
      typeof rawMessage === 'string'
        ? rawMessage.split('\n')[0].replace(/\s+at\s+.+$/i, '').trim()
        : 'Request failed'
    const code = payload.code || 'REQUEST_FAILED'
    const fieldErrors = fieldErrorsFromApi(
      payload.fieldErrors || payload.errors || null,
    )

    if (status === 401 && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler()
    }

    return Promise.reject(
      new ApiError({
        message,
        status,
        code,
        fieldErrors,
      }),
    )
  },
)

export default apiClient
