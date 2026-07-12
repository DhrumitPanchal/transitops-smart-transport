import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as userService from '../../services/userService'
import {
  applyUserCacheUpdate,
  unwrapUserResponse,
} from '../../features/users/userQueryCache'
import { USER_STATUS } from '../../constants/statuses'
import { markQueriesStaleWithoutRefetch } from '../../realtime/realtimeCache'
import { QUERY_KEYS } from '../../constants/queryKeys'

export function useApproveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => userService.approve(id, payload),
    onSuccess: (response, variables) => {
      const user = unwrapUserResponse(response)
      if (!user) return

      applyUserCacheUpdate(queryClient, user, { isCreate: false })

      // Pending-only lists may still show this user until filters re-evaluate
      const listQueries = queryClient.getQueriesData({
        queryKey: QUERY_KEYS.users.lists,
      })

      listQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return
        const params = Array.isArray(queryKey) ? queryKey[2] : null
        const statusFilter = params?.status

        if (statusFilter === USER_STATUS.PENDING) {
          queryClient.setQueryData(queryKey, (current) => {
            if (!current?.data) return current
            const nextRows = current.data.filter(
              (item) => String(item.id) !== String(variables.id),
            )
            const removed = nextRows.length !== current.data.length
            if (!removed) return current
            const totalItems = Math.max(
              0,
              (current.pagination?.totalItems || current.data.length) - 1,
            )
            const pageSize = current.pagination?.pageSize || 10
            return {
              ...current,
              data: nextRows,
              pagination: {
                ...current.pagination,
                totalItems,
                totalPages:
                  totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
              },
            }
          })
          return
        }

        if (
          statusFilter &&
          statusFilter !== USER_STATUS.ACTIVE &&
          statusFilter !== user.status
        ) {
          markQueriesStaleWithoutRefetch(queryClient, queryKey)
        }
      })
    },
  })
}
