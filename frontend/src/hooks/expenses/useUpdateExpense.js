import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as expenseService from '../../services/expenseService'
import {
  applyExpenseCacheUpdate,
  unwrapExpenseResponse,
} from '../../features/expenses/expenseQueryCache'

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => expenseService.update(id, payload),
    onSuccess: (response) => {
      const record = unwrapExpenseResponse(response)
      if (!record) return
      applyExpenseCacheUpdate(queryClient, record, { isCreate: false })
    },
  })
}
