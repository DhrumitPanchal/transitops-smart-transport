import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as userService from '../../services/userService'

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => userService.update(id, payload),
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
