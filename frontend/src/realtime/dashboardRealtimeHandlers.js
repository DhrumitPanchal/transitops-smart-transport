import { applyOptionalDashboardChanges } from '../features/dashboard/dashboardQueryCache'
import { fromApiEnvelope } from '../mappers/apiEnvelope'

const appliedDeltaEventIds = new Set()
const MAX_DELTA_IDS = 400

function rememberDeltaEvent(eventId) {
  if (!eventId) return true
  const key = String(eventId)
  if (appliedDeltaEventIds.has(key)) return false
  appliedDeltaEventIds.add(key)
  if (appliedDeltaEventIds.size > MAX_DELTA_IDS) {
    const first = appliedDeltaEventIds.values().next().value
    appliedDeltaEventIds.delete(first)
  }
  return true
}

/**
 * Listens for optional dashboardChanges on any socket event and applies
 * safe KPI deltas. Never calls dashboard or reports APIs.
 */
export function registerDashboardRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onAny = (_eventName, payload) => {
    if (!payload || typeof payload !== 'object') return
    const normalized = fromApiEnvelope(payload)
    const hasChanges = Boolean(
      normalized.dashboardChanges || normalized.data?.dashboardChanges,
    )
    if (!hasChanges) return
    if (!rememberDeltaEvent(normalized.eventId)) return
    applyOptionalDashboardChanges(queryClient, normalized)
  }

  if (typeof socket.onAny === 'function') {
    socket.onAny(onAny)
    return () => {
      if (typeof socket.offAny === 'function') {
        socket.offAny(onAny)
      }
    }
  }

  return () => {}
}
