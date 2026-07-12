import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as expenseService from '../../services/expenseService'

export function useExpense(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.detail(id),
    queryFn: () => expenseService.getById(id),
    enabled: Boolean(id) && options.enabled !== false,
    ...options,
  })
}
