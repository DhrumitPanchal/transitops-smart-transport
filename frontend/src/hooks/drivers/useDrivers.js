import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as driverService from '../../services/driverService'

export function useDrivers(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.drivers.list(params),
    queryFn: () => driverService.list(params),
    ...options,
  })
}
