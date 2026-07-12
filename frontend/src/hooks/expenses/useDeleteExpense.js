import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as expenseService from '../../services/expenseService'
import {
  applyExpenseCacheDelete,
  unwrapExpenseResponse,
} from '../../features/expenses/expenseQueryCache'

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => expenseService.remove(id),
    onSuccess: (response, id) => {
      const record = unwrapExpenseResponse(response)
      applyExpenseCacheDelete(queryClient, record || id)
    },
  })
}
