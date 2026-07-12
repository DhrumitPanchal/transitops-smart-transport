import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as fuelService from '../../services/fuelService'

export function useFuelLog(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.fuel.detail(id),
    queryFn: () => fuelService.getById(id),
    enabled: Boolean(id) && options.enabled !== false,
    ...options,
  })
}
