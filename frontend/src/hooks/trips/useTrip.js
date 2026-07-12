import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as tripService from '../../services/tripService'

export function useTrip(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.detail(id),
    queryFn: () => tripService.getById(id),
    enabled: Boolean(id) && options.enabled !== false,
    ...options,
  })
}
