import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as maintenanceService from '../../services/maintenanceService'
import {
  applyMaintenanceLifecycleToCache,
  unwrapMaintenanceMutationPayload,
} from '../../features/maintenance/maintenanceQueryCache'

export function useStartMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => maintenanceService.start(id),
    onSuccess: (response) => {
      const { maintenance, vehicle } =
        unwrapMaintenanceMutationPayload(response)
      if (!maintenance) return
      applyMaintenanceLifecycleToCache(queryClient, {
        maintenance,
        vehicle,
        isCreate: false,
      })
    },
  })
}
