import {
  applyUserCacheUpdate,
  unwrapUserResponse,
} from '../features/users/userQueryCache'
import {
  applyAuthSessionUserUpdate,
  forceAuthSessionLogout,
  getAuthSessionUser,
} from '../context/authSessionBridge'
import { USER_STATUS } from '../constants/statuses'
import { createGuardedHandler } from './createGuardedHandler'
import { SOCKET_EVENTS } from './socketEvents'

export { doesUserMatchFilters } from '../features/users/doesUserMatchFilters'

function extractUser(payload) {
  const data = payload?.data
  if (!data) return null
  if (data.user) return data.user
  if (data.id && data.email) return data
  return null
}

function syncCurrentUserFromEvent(user) {
  if (!user?.id) return

  const current = getAuthSessionUser()
  if (!current || String(current.id) !== String(user.id)) return

  if (user.status === USER_STATUS.INACTIVE) {
    forceAuthSessionLogout('inactive')
    return
  }

  applyAuthSessionUserUpdate({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
  })
}

export function registerUserRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractUser(payload) || unwrapUserResponse(payload)
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractUser(payload) || unwrapUserResponse(payload)
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: false })
    syncCurrentUserFromEvent(user)
  })

  const onStatusChanged = createGuardedHandler(queryClient, (client, payload) => {
    const user = extractUser(payload) || unwrapUserResponse(payload)
    if (!user?.id) return
    applyUserCacheUpdate(client, user, { isCreate: false })
    syncCurrentUserFromEvent(user)
  })

  socket.on(SOCKET_EVENTS.USER_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.USER_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.USER_STATUS_CHANGED, onStatusChanged)

  return () => {
    socket.off(SOCKET_EVENTS.USER_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.USER_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.USER_STATUS_CHANGED, onStatusChanged)
  }
}
