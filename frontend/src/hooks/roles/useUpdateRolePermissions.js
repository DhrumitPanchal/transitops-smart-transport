import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as roleService from '../../services/roleService'
import {
  applyRolePermissionsCacheUpdate,
  unwrapRoleResponse,
} from '../../features/roles/roleQueryCache'
import {
  applyAuthSessionUserUpdate,
  getAuthSessionUser,
} from '../../context/authSessionBridge'

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permissions }) =>
      roleService.updatePermissions(id, permissions),
    onSuccess: (response) => {
      const role = unwrapRoleResponse(response)
      if (!role) return
      applyRolePermissionsCacheUpdate(queryClient, role)

      const current = getAuthSessionUser()
      if (current?.role && role.key === current.role) {
        applyAuthSessionUserUpdate({
          permissions: role.permissions,
        })
      }
    },
  })
}
