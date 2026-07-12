import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as driverService from '../../services/driverService'
import { applyDriverStatusToCache } from '../../features/drivers/driverQueryCache'

export function useChangeDriverStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => driverService.changeStatus(id, status),
    onSuccess: (response) => {
      const driver = response?.data
      if (!driver) return
      applyDriverStatusToCache(queryClient, driver)
    },
  })
}
