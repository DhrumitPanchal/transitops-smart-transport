import { io } from 'socket.io-client'
import env from '../config/env'
import tokenManager from '../api/tokenManager'

let socket = null

function createSocket() {
  return io(env.SOCKET_URL || env.socketUrl, {
    autoConnect: false,
    withCredentials: env.AUTH_MODE !== 'bearer',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: (callback) => {
      if (env.AUTH_MODE === 'bearer') {
        Promise.resolve(tokenManager.getAccessToken())
          .then((token) => {
            callback(token ? { token } : {})
          })
          .catch(() => {
            callback({})
          })
        return
      }
      callback({})
    },
  })
}

export function shouldConnectRealtime({ isAuthenticated = false } = {}) {
  return Boolean(
    (env.ENABLE_REALTIME ?? env.enableRealtime) &&
      !(env.USE_MOCKS ?? env.useMocks) &&
      isAuthenticated,
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
