import { mockDelay } from '../mockDelay'
import {
  clearMockSession,
  getMockSessionUser,
  requireMockSession,
  setMockSessionUser,
} from '../session'
import {
  mockDashboardSummary,
  mockDrivers,
  mockExpenses,
  mockFuelLogs,
  mockMaintenance,
  mockRoles,
  mockTrips,
  mockUser,
  mockUsers,
  mockVehicles,
} from '../data'

export async function mockLogin({ email }) {
  await mockDelay()
  const user = {
    ...mockUser,
    email: email || mockUser.email,
  }
  setMockSessionUser(user)
  return { user }
}

export async function mockLogout() {
  await mockDelay()
  clearMockSession()
  return { success: true }
}

export async function mockGetMe() {
  await mockDelay()
  return requireMockSession()
}

export function mockHasSession() {
  return Boolean(getMockSessionUser())
}

export async function mockGetDashboardSummary() {
  await mockDelay()
  requireMockSession()
  return mockDashboardSummary
}

export async function mockGetVehicles() {
  await mockDelay()
  requireMockSession()
  return [...mockVehicles]
}

export async function mockGetVehicleById(id) {
  await mockDelay()
  requireMockSession()
  return mockVehicles.find((item) => item.id === id) || null
}

export async function mockGetDrivers() {
  await mockDelay()
  requireMockSession()
  return [...mockDrivers]
}

export async function mockGetDriverById(id) {
  await mockDelay()
  requireMockSession()
  return mockDrivers.find((item) => item.id === id) || null
}

export async function mockGetTrips() {
  await mockDelay()
  requireMockSession()
  return [...mockTrips]
}

export async function mockGetTripById(id) {
  await mockDelay()
  requireMockSession()
  return mockTrips.find((item) => item.id === id) || null
}

export async function mockGetMaintenance() {
  await mockDelay()
  requireMockSession()
  return [...mockMaintenance]
}

export async function mockGetMaintenanceById(id) {
  await mockDelay()
  requireMockSession()
  return mockMaintenance.find((item) => item.id === id) || null
}

export async function mockGetFuelLogs() {
  await mockDelay()
  requireMockSession()
  return [...mockFuelLogs]
}

export async function mockGetFuelById(id) {
  await mockDelay()
  requireMockSession()
  return mockFuelLogs.find((item) => item.id === id) || null
}

export async function mockGetExpenses() {
  await mockDelay()
  requireMockSession()
  return [...mockExpenses]
}

export async function mockGetExpenseById(id) {
  await mockDelay()
  requireMockSession()
  return mockExpenses.find((item) => item.id === id) || null
}

export async function mockGetReports() {
  await mockDelay()
  requireMockSession()
  return {
    summary: mockDashboardSummary,
    generatedAt: new Date().toISOString(),
  }
}

export async function mockGetUsers() {
  await mockDelay()
  requireMockSession()
  return [...mockUsers]
}

export async function mockGetUserById(id) {
  await mockDelay()
  requireMockSession()
  return mockUsers.find((item) => item.id === id) || null
}

export async function mockGetRoles() {
  await mockDelay()
  requireMockSession()
  return [...mockRoles]
}

export async function mockGetRoleById(id) {
  await mockDelay()
  requireMockSession()
  return mockRoles.find((item) => item.id === id) || null
}
