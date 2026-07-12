import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as maintenanceService from '../../services/maintenanceService'

export function useMaintenance(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.maintenance.detail(id),
    queryFn: () => maintenanceService.getById(id),
    enabled: Boolean(id),
    ...options,
  })
}
