import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as tripService from '../../services/tripService'
import { applyTripCreateToCache } from '../../features/trips/tripQueryCache'
import { unwrapTripMutationPayload } from '../../features/trips/tripErrors'

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => tripService.create(payload),
    onSuccess: (response) => {
      const { trip } = unwrapTripMutationPayload(response)
      if (!trip) return
      applyTripCreateToCache(queryClient, trip)
    },
  })
}
