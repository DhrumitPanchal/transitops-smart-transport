import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as roleService from '../../services/roleService'

export function useRoles(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.roles.list(params),
    queryFn: () => roleService.list(params),
    ...options,
  })
}
