import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as vehicleService from '../../services/vehicleService'

export function useVehicle(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.vehicles.detail(id),
    queryFn: () => vehicleService.getById(id),
    enabled: Boolean(id),
    ...options,
  })
}
