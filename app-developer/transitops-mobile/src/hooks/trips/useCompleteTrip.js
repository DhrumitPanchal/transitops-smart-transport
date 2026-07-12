import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as tripService from '../../services/tripService'

export function useCompleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => tripService.complete(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.drivers.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fuel.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
  })
}
