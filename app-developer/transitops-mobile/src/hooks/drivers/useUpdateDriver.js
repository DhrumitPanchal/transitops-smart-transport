import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as driverService from '../../services/driverService'

export function useUpdateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => driverService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.drivers.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.drivers.detail(variables.id),
        })
      }
    },
  })
}
