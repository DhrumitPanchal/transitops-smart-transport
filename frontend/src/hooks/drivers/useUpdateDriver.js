import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as driverService from '../../services/driverService'
import { applyDriverCacheUpdate } from '../../features/drivers/driverQueryCache'

export function useUpdateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => driverService.update(id, payload),
    onSuccess: (response) => {
      const driver = response?.data
      if (!driver) return
      applyDriverCacheUpdate(queryClient, driver, { isCreate: false })
    },
  })
}
