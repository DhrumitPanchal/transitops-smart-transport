import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as userService from '../../services/userService'
import {
  applyUserCacheUpdate,
  unwrapUserResponse,
} from '../../features/users/userQueryCache'
import { applyAuthSessionUserUpdate, getAuthSessionUser } from '../../context/authSessionBridge'

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => userService.update(id, payload),
    onSuccess: (response) => {
      const user = unwrapUserResponse(response)
      if (!user) return
      applyUserCacheUpdate(queryClient, user, { isCreate: false })

      const current = getAuthSessionUser()
      if (current && String(current.id) === String(user.id)) {
        applyAuthSessionUserUpdate({
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          permissions: user.permissions,
        })
      }
    },
  })
}
