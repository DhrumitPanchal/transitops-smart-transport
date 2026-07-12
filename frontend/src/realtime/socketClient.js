import { io } from 'socket.io-client'
import env from '../config/env'

let socket = null

function createSocket() {
  return io(env.socketUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })
}

export function shouldConnectRealtime({ isAuthenticated = false } = {}) {
  return Boolean(
    env.enableRealtime && !env.useMocks && isAuthenticated,
  )
}

export function getSocket() {
  if (!socket) {
    socket = createSocket()
  }
  return socket
}

export function connectSocket() {
  const instance = getSocket()

  if (!instance.connected && !instance.active) {
    instance.connect()
  }

  return instance
}

export function disconnectSocket() {
  if (!socket) return

  if (socket.connected || socket.active) {
    socket.disconnect()
  }
}

export function getSocketId() {
  if (!socket || !socket.connected) return null
  return socket.id || null
}

export function isSocketConnected() {
  return Boolean(socket?.connected)
}
