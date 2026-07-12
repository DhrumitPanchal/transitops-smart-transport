import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as expenseService from '../../services/expenseService'

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => expenseService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.expenses.detail(variables.id),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all })
    },
  })
}
