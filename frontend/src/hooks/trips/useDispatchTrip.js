import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as tripService from '../../services/tripService'
import { applyTripDispatchToCache } from '../../features/trips/tripQueryCache'
import { unwrapTripMutationPayload } from '../../features/trips/tripErrors'

export function useDispatchTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => tripService.dispatch(id),
    onSuccess: (response) => {
      applyTripDispatchToCache(queryClient, unwrapTripMutationPayload(response))
    },
  })
}
