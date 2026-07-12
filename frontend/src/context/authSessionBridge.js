/**
 * Bridge so realtime handlers can safely update auth session state
 * without importing React context (avoids circular deps / API calls).
 */
let handlers = {
  getCurrentUser: () => null,
  applyUserUpdate: null,
  forceLogout: null,
}

export function setAuthSessionHandlers(nextHandlers = {}) {
  handlers = {
    ...handlers,
    ...nextHandlers,
  }
}

export function getAuthSessionUser() {
  return typeof handlers.getCurrentUser === 'function'
    ? handlers.getCurrentUser()
    : null
}

export function applyAuthSessionUserUpdate(patch) {
  if (typeof handlers.applyUserUpdate === 'function') {
    handlers.applyUserUpdate(patch)
  }
}

export function forceAuthSessionLogout(reason) {
  if (typeof handlers.forceLogout === 'function') {
    handlers.forceLogout(reason)
  }
}
