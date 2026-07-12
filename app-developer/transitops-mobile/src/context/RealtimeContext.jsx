import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import env from '../config/env'
import { setSocketIdResolver } from '../api/apiClient'
import {
  REALTIME_STATUS,
  SOCKET_CONNECTION_EVENTS,
} from '../constants/socketEvents'
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  getSocketId,
  shouldConnectRealtime,
} from '../realtime/socketClient'
import { registerRealtimeHandlers } from '../realtime/registerRealtimeHandlers'

export const RealtimeContext = createContext(null)

function resolveIdleStatus() {
  if (!(env.ENABLE_REALTIME ?? env.enableRealtime) || (env.USE_MOCKS ?? env.useMocks)) {
    return REALTIME_STATUS.DISABLED
  }
  return REALTIME_STATUS.DISCONNECTED
}

export function RealtimeProvider({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState(
    REALTIME_STATUS.DISCONNECTED,
  )
  const [socketId, setSocketId] = useState(null)

  const canConnect =
    !isBootstrapping && shouldConnectRealtime({ isAuthenticated })

  const status = canConnect ? connectionStatus : resolveIdleStatus()

  useEffect(() => {
    setSocketIdResolver(() => getSocketId())
    return () => {
      setSocketIdResolver(() => null)
    }
  }, [])

  const refreshStatus = useCallback(() => {
    if (!canConnect) {
      setSocketId(null)
      return
    }

    const socket = getSocket()
    setSocketId(socket.connected ? socket.id || null : null)

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
      setSocketId(null)
      setConnectionStatus(resolveIdleStatus())
      return undefined
    }

    let cancelled = false
    const socket = connectSocket()
    const unregisterHandlers = registerRealtimeHandlers(socket, queryClient)

    const handleConnect = () => {
      if (cancelled) return
      setConnectionStatus(REALTIME_STATUS.CONNECTED)
      setSocketId(socket.id || null)
    }

    const handleDisconnect = () => {
      if (cancelled) return
      setConnectionStatus(REALTIME_STATUS.DISCONNECTED)
      setSocketId(null)
    }

    const handleConnectError = () => {
      if (cancelled) return
      setConnectionStatus(REALTIME_STATUS.ERROR)
      setSocketId(null)
    }

    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT, handleConnect)
    socket.on(SOCKET_CONNECTION_EVENTS.DISCONNECT, handleDisconnect)
    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT_ERROR, handleConnectError)

    queueMicrotask(() => {
      if (cancelled) return
      if (socket.connected) {
        setConnectionStatus(REALTIME_STATUS.CONNECTED)
        setSocketId(socket.id || null)
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
      setSocketId(null)
    }
  }, [canConnect, queryClient])

  // Disconnect on logout (when auth drops while provider stays mounted)
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket()
      setSocketId(null)
    }
  }, [isAuthenticated])

  const value = useMemo(
    () => ({
      connectionStatus: status,
      status,
      socketId,
      isEnabled:
        Boolean(env.ENABLE_REALTIME ?? env.enableRealtime) &&
        !(env.USE_MOCKS ?? env.useMocks),
      isConnected: status === REALTIME_STATUS.CONNECTED,
      refreshStatus,
    }),
    [status, socketId, refreshStatus],
  )

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
