import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as tripService from '../../services/tripService'
import { applyTripCompleteToCache } from '../../features/trips/tripQueryCache'
import { unwrapTripMutationPayload } from '../../features/trips/tripErrors'

export function useCompleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => tripService.complete(id, payload),
    onSuccess: (response) => {
      applyTripCompleteToCache(queryClient, unwrapTripMutationPayload(response))
    },
  })
}
