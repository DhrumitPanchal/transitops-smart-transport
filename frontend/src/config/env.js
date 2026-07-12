const metaEnv = import.meta.env || {}

const env = {
  appName: metaEnv.VITE_APP_NAME || 'TransitOps',
  apiBaseUrl: metaEnv.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  useMocks: String(metaEnv.VITE_USE_MOCKS).toLowerCase() === 'true',
  requestTimeout: Number(metaEnv.VITE_REQUEST_TIMEOUT) || 15000,
  enableRealtime: String(metaEnv.VITE_ENABLE_REALTIME).toLowerCase() === 'true',
  socketUrl: metaEnv.VITE_SOCKET_URL || 'http://localhost:5000',
}

export default env
