import { QUERY_KEYS } from '../../constants/queryKeys'
import { markQueriesStaleWithoutRefetch } from '../../realtime/realtimeCache'

const SAFE_KPI_DELTA_KEYS = new Set([
  'activeVehicles',
  'availableVehicles',
  'vehiclesOnTrip',
  'vehiclesInMaintenance',
  'activeTrips',
  'pendingTrips',
  'driversOnDuty',
  'availableDrivers',
  'fleetUtilization',
  'totalOperationalCost',
  'fuelCost',
  'maintenanceCost',
  'expenses',
  'revenue',
  'vehicleRoi',
  'fuelEfficiency',
  'expiredLicences',
  'expiringLicences',
  'suspendedDrivers',
  'averageSafetyScore',
])

export function markDashboardStaleWithoutRefetch(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
}

export function markReportsStaleWithoutRefetch(queryClient) {
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.reports.all)
}

export function markDashboardAndReportsStaleWithoutRefetch(queryClient) {
  markDashboardStaleWithoutRefetch(queryClient)
  markReportsStaleWithoutRefetch(queryClient)
}

function extractDashboardChanges(payload) {
  if (!payload || typeof payload !== 'object') return null

  if (payload.dashboardChanges && typeof payload.dashboardChanges === 'object') {
    return payload.dashboardChanges
  }

  if (
    payload.data?.dashboardChanges &&
    typeof payload.data.dashboardChanges === 'object'
  ) {
    return payload.data.dashboardChanges
  }

  return null
}

function applySafeKpiDeltas(kpis = {}, changes = {}) {
  let changed = false
  const next = { ...kpis }

  Object.entries(changes).forEach(([key, delta]) => {
    if (!SAFE_KPI_DELTA_KEYS.has(key)) return
    const amount = Number(delta)
    if (!Number.isFinite(amount) || amount === 0) return

    const current = Number(next[key] ?? 0)
    if (!Number.isFinite(current)) return

    next[key] = Math.round((current + amount) * 100) / 100
    changed = true
  })

  return changed ? next : null
}

/**
 * Preferred realtime path: apply optional numeric KPI deltas from socket payload.
 * Returns true when at least one cached dashboard summary was updated.
 * Never calls the dashboard API.
 */
export function applyOptionalDashboardChanges(queryClient, payload) {
  if (!queryClient) return false

  const changes = extractDashboardChanges(payload)
  if (!changes) return false

  const queries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.dashboard.all,
  })

  let applied = false

  queries.forEach(([queryKey, oldData]) => {
    if (!oldData?.data?.kpis) return

    const nextKpis = applySafeKpiDeltas(oldData.data.kpis, changes)
    if (!nextKpis) return

    queryClient.setQueryData(queryKey, {
      ...oldData,
      data: {
        ...oldData.data,
        kpis: nextKpis,
      },
    })
    applied = true
  })

  return applied
}
