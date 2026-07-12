import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as fuelService from '../../services/fuelService'
import {
  applyFuelLogCacheDelete,
  unwrapFuelLogResponse,
} from '../../features/fuel/fuelQueryCache'

export function useDeleteFuelLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => fuelService.remove(id),
    onSuccess: (response, id) => {
      const record = unwrapFuelLogResponse(response)
      applyFuelLogCacheDelete(queryClient, record || id)
    },
  })
}
