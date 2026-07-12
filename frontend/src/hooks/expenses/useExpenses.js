import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as expenseService from '../../services/expenseService'

export function useExpenses(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses.list(params),
    queryFn: () => expenseService.list(params),
    ...options,
  })
}
