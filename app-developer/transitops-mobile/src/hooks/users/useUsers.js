import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as userService from '../../services/userService'

export function useUsers(params = {}, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.users.list(params),
    queryFn: () => userService.list(params),
    ...options,
  })
}
