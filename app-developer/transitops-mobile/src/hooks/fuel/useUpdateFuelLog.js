import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as fuelService from '../../services/fuelService'

export function useUpdateFuelLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => fuelService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fuel.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.fuel.detail(variables.id),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
  })
}
