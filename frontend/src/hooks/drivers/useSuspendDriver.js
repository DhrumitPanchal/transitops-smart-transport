import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as driverService from '../../services/driverService'
import { applyDriverSuspendToCache } from '../../features/drivers/driverQueryCache'

export function useSuspendDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => driverService.suspend(id),
    onSuccess: (response) => {
      const driver = response?.data
      if (!driver) return
      applyDriverSuspendToCache(queryClient, driver)
    },
  })
}
