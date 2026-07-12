import {
  getProcessedRealtimeEventCount,
  resetRealtimeEventGuard,
  shouldProcessRealtimeEvent,
} from '@/realtime/realtimeEventGuard'

describe('realtimeGuard', () => {
  beforeEach(() => {
    resetRealtimeEventGuard()
  })

  it('processes a new event id once', () => {
    expect(shouldProcessRealtimeEvent('evt-1')).toBe(true)
    expect(shouldProcessRealtimeEvent('evt-1')).toBe(false)
    expect(getProcessedRealtimeEventCount()).toBe(1)
  })

  it('allows missing event ids every time', () => {
    expect(shouldProcessRealtimeEvent(null)).toBe(true)
    expect(shouldProcessRealtimeEvent(undefined)).toBe(true)
    expect(shouldProcessRealtimeEvent('')).toBe(true)
    expect(getProcessedRealtimeEventCount()).toBe(0)
  })

  it('tracks distinct event ids independently', () => {
    expect(shouldProcessRealtimeEvent('a')).toBe(true)
    expect(shouldProcessRealtimeEvent('b')).toBe(true)
    expect(shouldProcessRealtimeEvent('a')).toBe(false)
    expect(shouldProcessRealtimeEvent('b')).toBe(false)
    expect(getProcessedRealtimeEventCount()).toBe(2)
  })

  it('resets processed events', () => {
    shouldProcessRealtimeEvent('evt-reset')
    expect(getProcessedRealtimeEventCount()).toBe(1)
    resetRealtimeEventGuard()
    expect(getProcessedRealtimeEventCount()).toBe(0)
    expect(shouldProcessRealtimeEvent('evt-reset')).toBe(true)
  })

  it('caps stored event ids at 500', () => {
    for (let index = 0; index < 520; index += 1) {
      shouldProcessRealtimeEvent(`evt-${index}`)
    }
    expect(getProcessedRealtimeEventCount()).toBeLessThanOrEqual(500)
  })
})
