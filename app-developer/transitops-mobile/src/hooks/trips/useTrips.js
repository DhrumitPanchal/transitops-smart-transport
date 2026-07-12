import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as tripService from '../../services/tripService'

export function useTrips(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.list(params),
    queryFn: () => tripService.list(params),
    ...options,
  })
}
