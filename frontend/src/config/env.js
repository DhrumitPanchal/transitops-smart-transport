const env = {
  appName: import.meta.env.VITE_APP_NAME || 'TransitOps',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  useMocks: String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true',
  requestTimeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000,
}

export default env
