import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as driverService from '../../services/driverService'

export function useSuspendDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => driverService.suspend(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.drivers.all })
      if (id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.drivers.detail(id),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
    },
  })
}
