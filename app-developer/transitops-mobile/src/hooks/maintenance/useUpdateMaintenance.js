import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as maintenanceService from '../../services/maintenanceService'

export function useUpdateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => maintenanceService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.maintenance.detail(variables.id),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
    },
  })
}
