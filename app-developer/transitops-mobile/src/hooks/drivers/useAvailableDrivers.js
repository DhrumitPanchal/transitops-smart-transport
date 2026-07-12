import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as driverService from '../../services/driverService'

export function useAvailableDrivers(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.drivers.available,
    queryFn: () => driverService.getAvailable(params),
    ...options,
  })
}
