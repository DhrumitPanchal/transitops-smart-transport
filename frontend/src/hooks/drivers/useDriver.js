import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as driverService from '../../services/driverService'

export function useDriver(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.drivers.detail(id),
    queryFn: () => driverService.getById(id),
    enabled: Boolean(id) && options.enabled !== false,
    ...options,
  })
}
