import apiClient from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import env from '../config/env'
import { mockGetTripById, mockGetTrips } from '../mocks/repositories'

export async function getTrips(params = {}) {
  if (env.useMocks) {
    return mockGetTrips()
  }

  const { data } = await apiClient.get(ENDPOINTS.TRIPS.BASE, { params })
  return data
}

export async function getTripById(id) {
  if (env.useMocks) {
    return mockGetTripById(id)
  }

  const { data } = await apiClient.get(ENDPOINTS.TRIPS.BY_ID(id))
  return data
}

export async function createTrip(payload) {
  const { data } = await apiClient.post(ENDPOINTS.TRIPS.BASE, payload)
  return data
}

export async function updateTrip(id, payload) {
  const { data } = await apiClient.put(ENDPOINTS.TRIPS.BY_ID(id), payload)
  return data
}

export async function deleteTrip(id) {
  const { data } = await apiClient.delete(ENDPOINTS.TRIPS.BY_ID(id))
  return data
}
