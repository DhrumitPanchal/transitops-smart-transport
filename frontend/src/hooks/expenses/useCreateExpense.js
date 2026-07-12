import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as expenseService from '../../services/expenseService'
import {
  applyExpenseCacheUpdate,
  unwrapExpenseResponse,
} from '../../features/expenses/expenseQueryCache'

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => expenseService.create(payload),
    onSuccess: (response) => {
      const record = unwrapExpenseResponse(response)
      if (!record) return
      applyExpenseCacheUpdate(queryClient, record, { isCreate: true })
    },
  })
}
