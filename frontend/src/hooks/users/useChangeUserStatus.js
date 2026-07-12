import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as userService from '../../services/userService'
import {
  applyUserCacheUpdate,
  unwrapUserResponse,
} from '../../features/users/userQueryCache'
import {
  applyAuthSessionUserUpdate,
  forceAuthSessionLogout,
  getAuthSessionUser,
} from '../../context/authSessionBridge'
import { USER_STATUS } from '../../constants/statuses'

export function useChangeUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => userService.changeStatus(id, status),
    onSuccess: (response) => {
      const user = unwrapUserResponse(response)
      if (!user) return
      applyUserCacheUpdate(queryClient, user, { isCreate: false })

      const current = getAuthSessionUser()
      if (current && String(current.id) === String(user.id)) {
        if (user.status === USER_STATUS.INACTIVE) {
          forceAuthSessionLogout('inactive')
          return
        }
        applyAuthSessionUserUpdate({ status: user.status })
      }
    },
  })
}
