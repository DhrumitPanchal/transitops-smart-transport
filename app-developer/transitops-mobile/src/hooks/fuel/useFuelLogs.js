import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as fuelService from '../../services/fuelService'

export function useFuelLogs(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.fuel.list(params),
    queryFn: () => fuelService.list(params),
    ...options,
  })
}
