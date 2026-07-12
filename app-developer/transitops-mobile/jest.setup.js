process.env.EXPO_PUBLIC_USE_MOCKS = 'true'
process.env.EXPO_PUBLIC_AUTH_MODE = 'bearer'
process.env.EXPO_PUBLIC_ENABLE_REALTIME = 'false'

jest.mock('@/mocks/mockDelay', () => ({
  mockDelay: jest.fn(() => Promise.resolve()),
}))

beforeEach(() => {
  const SecureStore = require('expo-secure-store')
  if (typeof SecureStore.__clearMemory === 'function') {
    SecureStore.__clearMemory()
  }
})
