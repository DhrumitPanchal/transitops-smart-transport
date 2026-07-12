import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as driverService from '../../services/driverService'
import { applyDriverCacheUpdate } from '../../features/drivers/driverQueryCache'

export function useCreateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => driverService.create(payload),
    onSuccess: (response) => {
      const driver = response?.data
      if (!driver) return
      applyDriverCacheUpdate(queryClient, driver, { isCreate: true })
    },
  })
}
