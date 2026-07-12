import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as dashboardService from '../../services/dashboardService'

export function useDashboardSummary(filters = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary(filters),
    queryFn: () => dashboardService.getSummary(),
    staleTime: 60_000,
    ...options,
  })
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.refetchQueries({
      queryKey: QUERY_KEYS.dashboard.all,
      type: 'active',
    })
  }
}
