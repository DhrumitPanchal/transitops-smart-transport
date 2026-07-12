import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as userService from '../../services/userService'
import {
  applyUserCacheUpdate,
  unwrapUserResponse,
} from '../../features/users/userQueryCache'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => userService.create(payload),
    onSuccess: (response) => {
      const user = unwrapUserResponse(response)
      if (!user) return
      applyUserCacheUpdate(queryClient, user, { isCreate: true })
    },
  })
}
