import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../constants/queryKeys'
import * as roleService from '../../services/roleService'

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permissions }) =>
      roleService.updatePermissions(id, permissions),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roles.detail(variables.id),
        })
      }
    },
  })
}
