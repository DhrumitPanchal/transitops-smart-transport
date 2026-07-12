import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as fuelService from '../../services/fuelService'
import {
  applyFuelLogCacheUpdate,
  unwrapFuelLogResponse,
} from '../../features/fuel/fuelQueryCache'

export function useCreateFuelLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => fuelService.create(payload),
    onSuccess: (response) => {
      const record = unwrapFuelLogResponse(response)
      if (!record) return
      applyFuelLogCacheUpdate(queryClient, record, { isCreate: true })
    },
  })
}
