import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as maintenanceService from '../../services/maintenanceService'

export function useCompleteMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => maintenanceService.complete(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
  })
}
