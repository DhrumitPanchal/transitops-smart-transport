import {
  applyRolePermissionsCacheUpdate,
  unwrapRoleResponse,
} from '../features/roles/roleQueryCache'
import {
  applyAuthSessionUserUpdate,
  getAuthSessionUser,
} from '../context/authSessionBridge'
import { createGuardedHandler } from './createGuardedHandler'
import { SOCKET_EVENTS } from './socketEvents'

function extractRolePayload(payload) {
  const data = payload?.data || {}
  const role = data.role || unwrapRoleResponse(payload)
  const permissions = Array.isArray(data.permissions)
    ? data.permissions
    : role?.permissions

  if (!role) return null

  return {
    role: {
      ...role,
      permissions: Array.isArray(permissions) ? permissions : role.permissions,
    },
    permissions: Array.isArray(permissions) ? permissions : role.permissions,
  }
}

function syncCurrentUserPermissions(role, permissions) {
  const current = getAuthSessionUser()
  if (!current?.role || !role?.key) return
  if (current.role !== role.key) return

  applyAuthSessionUserUpdate({
    permissions: Array.isArray(permissions) ? [...permissions] : [],
  })
}

export function registerRoleRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onPermissionsUpdated = createGuardedHandler(
    queryClient,
    (client, payload) => {
      const extracted = extractRolePayload(payload)
      if (!extracted?.role?.id) return

      applyRolePermissionsCacheUpdate(client, extracted.role)
      syncCurrentUserPermissions(extracted.role, extracted.permissions)
    },
  )

  socket.on(SOCKET_EVENTS.ROLE_PERMISSIONS_UPDATED, onPermissionsUpdated)
  socket.on(SOCKET_EVENTS.ROLE_PERMISSIONS_CHANGED, onPermissionsUpdated)

  return () => {
    socket.off(SOCKET_EVENTS.ROLE_PERMISSIONS_UPDATED, onPermissionsUpdated)
    socket.off(SOCKET_EVENTS.ROLE_PERMISSIONS_CHANGED, onPermissionsUpdated)
  }
}
