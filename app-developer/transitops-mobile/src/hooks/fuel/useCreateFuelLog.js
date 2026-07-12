import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as fuelService from '../../services/fuelService'

export function useCreateFuelLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => fuelService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fuel.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
  })
}
