import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as dashboardService from '../../services/dashboardService'

export function useDashboardSummary(options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.summary({}),
    queryFn: () => dashboardService.getSummary(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
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
