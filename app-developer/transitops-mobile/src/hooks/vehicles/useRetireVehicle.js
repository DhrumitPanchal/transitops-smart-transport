import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as vehicleService from '../../services/vehicleService'

export function useRetireVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => vehicleService.retire(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      if (id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.vehicles.detail(id),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
    },
  })
}
