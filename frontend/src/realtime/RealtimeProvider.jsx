import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import env from '../config/env'
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  shouldConnectRealtime,
} from './socketClient'
import { registerRealtimeHandlers } from './registerRealtimeHandlers'
import { REALTIME_STATUS, SOCKET_CONNECTION_EVENTS } from './socketEvents'
import { RealtimeContext } from './realtimeContext'

function resolveIdleStatus() {
  if (!env.enableRealtime || env.useMocks) {
    return REALTIME_STATUS.DISABLED
  }
  return REALTIME_STATUS.DISCONNECTED
}

export function RealtimeProvider({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState(
    REALTIME_STATUS.DISCONNECTED,
  )

  const canConnect =
    !isInitializing && shouldConnectRealtime({ isAuthenticated })

  const status = canConnect ? connectionStatus : resolveIdleStatus()

  const refreshStatus = useCallback(() => {
    if (!canConnect) return

    const socket = getSocket()
    if (socket.connected) {
      setConnectionStatus(REALTIME_STATUS.CONNECTED)
      return
    }
    if (socket.active) {
      setConnectionStatus(REALTIME_STATUS.CONNECTING)
      return
    }
    setConnectionStatus(REALTIME_STATUS.DISCONNECTED)
  }, [canConnect])

  useEffect(() => {
    if (!canConnect) {
      disconnectSocket()
      return undefined
    }

    let cancelled = false
    const socket = connectSocket()
    const unregisterHandlers = registerRealtimeHandlers(socket, queryClient)

    const handleConnect = () => {
      if (!cancelled) {
        setConnectionStatus(REALTIME_STATUS.CONNECTED)
      }
    }

    const handleDisconnect = () => {
      if (!cancelled) {
        setConnectionStatus(REALTIME_STATUS.DISCONNECTED)
      }
    }

    const handleConnectError = () => {
      if (!cancelled) {
        setConnectionStatus(REALTIME_STATUS.ERROR)
      }
    }

    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT, handleConnect)
    socket.on(SOCKET_CONNECTION_EVENTS.DISCONNECT, handleDisconnect)
    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR, handleConnectError)

    queueMicrotask(() => {
      if (cancelled) return
      if (socket.connected) {
        setConnectionStatus(REALTIME_STATUS.CONNECTED)
      } else {
        setConnectionStatus(REALTIME_STATUS.CONNECTING)
      }
    })

    return () => {
      cancelled = true
      unregisterHandlers()
      socket.off(SOCKET_CONNECTION_EVENTS.CONNECT, handleConnect)
      socket.off(SOCKET_CONNECTION_EVENTS.DISCONNECT, handleDisconnect)
      socket.off(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR, handleConnectError)
      disconnectSocket()
    }
  }, [canConnect, queryClient])

  const value = useMemo(
    () => ({
      status,
      isEnabled: env.enableRealtime && !env.useMocks,
      isConnected: status === REALTIME_STATUS.CONNECTED,
      refreshStatus,
    }),
    [status, refreshStatus],
  )

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
