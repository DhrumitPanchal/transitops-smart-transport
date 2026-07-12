import axios from 'axios'
import env from '../config/env'
import { ApiError } from './apiError'

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 500
    const payload = error.response?.data || {}
    const message = payload.message || error.message || 'Request failed'
    const code = payload.code || 'REQUEST_FAILED'
    const fieldErrors = payload.fieldErrors || null

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
