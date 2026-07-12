const MAX_EVENT_IDS = 400
const EVENT_TTL_MS = 5 * 60 * 1000

/** @type {Map<string, number>} */
const processedEvents = new Map()

function pruneProcessedEvents(now = Date.now()) {
  for (const [eventId, seenAt] of processedEvents) {
    if (now - seenAt > EVENT_TTL_MS) {
      processedEvents.delete(eventId)
    }
  }

  if (processedEvents.size <= MAX_EVENT_IDS) return

  const ordered = [...processedEvents.entries()].sort((a, b) => a[1] - b[1])
  const overflow = processedEvents.size - MAX_EVENT_IDS

  for (let index = 0; index < overflow; index += 1) {
    processedEvents.delete(ordered[index][0])
  }
}

/**
 * Returns true when this eventId should be processed.
 * Duplicate IDs are ignored. Missing IDs are allowed once per call path
 * but cannot be de-duplicated.
 */
export function shouldProcessRealtimeEvent(eventId) {
  pruneProcessedEvents()

  if (!eventId) {
    return true
  }

  const key = String(eventId)

  if (processedEvents.has(key)) {
    return false
  }

  processedEvents.set(key, Date.now())
  pruneProcessedEvents()
  return true
}

export function resetRealtimeEventGuard() {
  processedEvents.clear()
}

export function getProcessedRealtimeEventCount() {
  return processedEvents.size
}
