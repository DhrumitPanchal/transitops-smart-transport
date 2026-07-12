import env from '../config/env'

export function isMockMode() {
  return Boolean(env.USE_MOCKS ?? env.useMocks)
}

export function getServiceMode() {
  return isMockMode() ? 'mock' : 'api'
}
