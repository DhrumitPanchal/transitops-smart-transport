import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as fuelService from '../../services/fuelService'
import {
  applyFuelLogCacheUpdate,
  unwrapFuelLogResponse,
} from '../../features/fuel/fuelQueryCache'

export function useUpdateFuelLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => fuelService.update(id, payload),
    onSuccess: (response) => {
      const record = unwrapFuelLogResponse(response)
      if (!record) return
      applyFuelLogCacheUpdate(queryClient, record, { isCreate: false })
    },
  })
}
