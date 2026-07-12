import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as tripService from '../../services/tripService'

export function useUpdateDraftTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => tripService.updateDraft(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.trips.detail(variables.id),
        })
      }
    },
  })
}
