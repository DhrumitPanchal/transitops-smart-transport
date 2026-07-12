import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as vehicleService from '../../services/vehicleService'

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => vehicleService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.vehicles.detail(variables.id),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
    },
  })
}
