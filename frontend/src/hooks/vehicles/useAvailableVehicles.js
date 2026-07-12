import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as vehicleService from '../../services/vehicleService'

export function useAvailableVehicles(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles.available,
    queryFn: () => vehicleService.getAvailable(params),
    ...options,
  })
}
