import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as vehicleService from '../../services/vehicleService'

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => vehicleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
    },
  })
}
