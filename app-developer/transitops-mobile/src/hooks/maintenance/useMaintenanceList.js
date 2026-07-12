import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as maintenanceService from '../../services/maintenanceService'

export function useMaintenanceList(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.maintenance.list(params),
    queryFn: () => maintenanceService.list(params),
    ...options,
  })
}
