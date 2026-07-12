import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as tripService from '../../services/tripService'
import { applyTripCancelToCache } from '../../features/trips/tripQueryCache'
import { unwrapTripMutationPayload } from '../../features/trips/tripErrors'

export function useCancelTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => tripService.cancel(id, payload),
    onSuccess: (response) => {
      applyTripCancelToCache(queryClient, unwrapTripMutationPayload(response))
    },
  })
}
