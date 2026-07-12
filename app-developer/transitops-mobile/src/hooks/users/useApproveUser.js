import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as userService from '../../services/userService'

export function useApproveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => userService.approve(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.users.detail(variables.id),
        })
      }
    },
  })
}
