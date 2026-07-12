import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as roleService from '../../services/roleService'

export function useRole(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.roles.detail(id),
    queryFn: () => roleService.getById(id),
    enabled: Boolean(id) && options.enabled !== false,
    ...options,
  })
}
