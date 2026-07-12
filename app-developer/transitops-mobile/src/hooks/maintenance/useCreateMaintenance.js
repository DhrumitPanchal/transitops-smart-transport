import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as maintenanceService from '../../services/maintenanceService'

export function useCreateMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => maintenanceService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all })
    },
  })
}
