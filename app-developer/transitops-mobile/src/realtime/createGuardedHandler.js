import { fromApiEnvelope } from '../mappers/apiEnvelope'
import { shouldProcessRealtimeEvent } from './realtimeEventGuard'

/**
 * Shared Socket.IO listener wrapper:
 * - camelCases backend payloads
 * - ignores duplicate eventIds
 * - never triggers REST fetches
 */
export function createGuardedHandler(queryClient, handler) {
  return (payload) => {
    const normalized = fromApiEnvelope(payload)
    if (!shouldProcessRealtimeEvent(normalized?.eventId)) {
      return
    }
    handler(queryClient, normalized)
  }
}
