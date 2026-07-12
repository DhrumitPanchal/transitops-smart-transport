import { useQuery, useMutation } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as reportService from '../../services/reportService'

export function useReportSummary(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.summary(params),
    queryFn: () => reportService.getSummary(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    ...options,
  })
}

export function useExportReportCsv() {
  return useMutation({
    mutationFn: (params = {}) => reportService.exportCsv(params),
  })
}
