import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as tripService from '../../services/tripService'
import { applyTripCacheUpdate } from '../../features/trips/tripQueryCache'
import { unwrapTripMutationPayload } from '../../features/trips/tripErrors'

export function useUpdateDraftTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => tripService.updateDraft(id, payload),
    onSuccess: (response) => {
      const { trip } = unwrapTripMutationPayload(response)
      if (!trip) return
      applyTripCacheUpdate(queryClient, trip, { isCreate: false })
    },
  })
}
