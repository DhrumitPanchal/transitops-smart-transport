import { useContext } from 'react'
import { RealtimeContext } from './realtimeContext'
import { REALTIME_STATUS } from './socketEvents'

export function useRealtimeStatus() {
  const context = useContext(RealtimeContext)

  if (!context) {
    throw new Error('useRealtimeStatus must be used within a RealtimeProvider')
  }

  const { status, isEnabled, isConnected, refreshStatus } = context

  return {
    status,
    isEnabled,
    isConnected,
    isConnecting: status === REALTIME_STATUS.CONNECTING,
    isDisabled: status === REALTIME_STATUS.DISABLED,
    isDisconnected: status === REALTIME_STATUS.DISCONNECTED,
    isError: status === REALTIME_STATUS.ERROR,
    refreshStatus,
  }
}
