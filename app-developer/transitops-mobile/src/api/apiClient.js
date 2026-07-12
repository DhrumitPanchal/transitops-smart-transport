import axios from 'axios'
import env, { AUTH_MODE, API_BASE_URL, REQUEST_TIMEOUT } from '../config/env'
import { ApiError } from './apiError'
import { ENDPOINTS } from './endpoints'
import tokenManager from './tokenManager'
import {
  fieldErrorsFromApi,
  fieldErrorsFromDetails,
} from '../mappers/apiEnvelope'

const isBearerMode = AUTH_MODE === 'bearer'

let unauthorizedHandler = null
let socketIdResolver = () => null
let refreshPromise = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

export function setSocketIdResolver(resolver) {
  socketIdResolver = typeof resolver === 'function' ? resolver : () => null
}

function getSocketId() {
  try {
    return socketIdResolver()
  } catch {
    return null
  }
}

function cleanMessage(rawMessage) {
  if (typeof rawMessage !== 'string') return 'Request failed'
  return rawMessage.split('\n')[0].replace(/\s+at\s+.+$/i, '').trim()
}

function toApiError(error) {
  const status = error.response?.status || 500
  const payload = error.response?.data || {}
  const message = cleanMessage(
    payload.message || error.message || 'Request failed',
  )
  const code = payload.code || 'REQUEST_FAILED'
  const fieldErrors = fieldErrorsFromApi(
    payload.fieldErrors ||
      payload.errors ||
      fieldErrorsFromDetails(payload.details) ||
      null,
  )

  return new ApiError({
    message,
    status,
    code,
    fieldErrors,
  })
}

const apiClient = axios.create({
  baseURL: API_BASE_URL || env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT || env.requestTimeout,
  withCredentials: !isBearerMode,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const headers = config.headers || {}

  if (isBearerMode) {
    const accessToken = await tokenManager.getAccessToken()
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    } else if (typeof headers.delete === 'function') {
      headers.delete('Authorization')
    } else {
      delete headers.Authorization
    }
  }

  const socketId = getSocketId()
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

async function refreshAccessToken() {
  if (!isBearerMode) return null

  const refreshToken = await tokenManager.getRefreshToken()
  if (!refreshToken) {
    throw new ApiError({
      status: 401,
      code: 'REFRESH_TOKEN_MISSING',
      message: 'Session expired. Please sign in again.',
    })
  }

  const response = await axios.post(
    `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: REQUEST_TIMEOUT,
      withCredentials: false,
    },
  )

  const payload = response?.data?.data || response?.data || {}
  const accessToken = payload.accessToken || payload.access_token || null
  const nextRefreshToken =
    payload.refreshToken || payload.refresh_token || refreshToken

  if (!accessToken) {
    throw new ApiError({
      status: 401,
      code: 'REFRESH_FAILED',
      message: 'Unable to refresh session.',
    })
  }

  await tokenManager.setTokens({
    accessToken,
    refreshToken: nextRefreshToken,
  })

  return accessToken
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const status = error.response?.status
    const apiError = toApiError(error)

    const isRefreshCall = String(originalRequest?.url || '').includes(
      ENDPOINTS.AUTH.REFRESH,
    )

    if (
      isBearerMode &&
      status === 401 &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }

        const accessToken = await refreshPromise
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        await tokenManager.clearTokens()
        if (typeof unauthorizedHandler === 'function') {
          unauthorizedHandler()
        }
        return Promise.reject(
          refreshError instanceof ApiError
            ? refreshError
            : toApiError(refreshError),
        )
      }
    }

    if (status === 401 && typeof unauthorizedHandler === 'function') {
      if (isBearerMode) {
        await tokenManager.clearTokens()
      }
      unauthorizedHandler()
    }

    return Promise.reject(apiError)
  },
)

export default apiClient
