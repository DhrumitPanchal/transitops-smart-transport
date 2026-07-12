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
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || error.message || 'Request failed'
    const errors = error.response?.data?.errors || null

    if (status === 401 && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler()
    }

    return Promise.reject(new ApiError(message, status || 500, errors))
  },
)

export default apiClient
