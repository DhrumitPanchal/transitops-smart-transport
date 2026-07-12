import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as vehicleService from '../../services/vehicleService'

export function useVehicles(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles.list(params),
    queryFn: () => vehicleService.list(params),
    ...options,
  })
}
