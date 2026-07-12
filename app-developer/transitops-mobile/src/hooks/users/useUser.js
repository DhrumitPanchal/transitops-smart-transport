import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as userService from '../../services/userService'

export function useUser(id, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.users.detail(id),
    queryFn: () => userService.getById(id),
    enabled: Boolean(id),
    ...options,
  })
}
