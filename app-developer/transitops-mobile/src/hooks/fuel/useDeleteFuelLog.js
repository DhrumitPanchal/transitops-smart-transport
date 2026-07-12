import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as fuelService from '../../services/fuelService'

export function useDeleteFuelLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => fuelService.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fuel.all })
      if (id) {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.fuel.detail(id) })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
  })
}
