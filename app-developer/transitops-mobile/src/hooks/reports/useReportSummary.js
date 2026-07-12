import { useQuery, useMutation } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as reportService from '../../services/reportService'

export function useReportSummary(filters = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.summary(filters),
    queryFn: () => reportService.getSummary(filters),
    staleTime: 60_000,
    ...options,
  })
}

export function useExportReportCsv() {
  return useMutation({
    mutationFn: (params = {}) => reportService.exportCsv(params),
  })
}
