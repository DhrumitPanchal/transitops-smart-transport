import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as vehicleService from '../../services/vehicleService'
import { applyVehicleCacheUpdate } from '../../features/vehicles/vehicleQueryCache'

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => vehicleService.create(payload),
    onSuccess: (response) => {
      const vehicle = response?.data
      if (!vehicle) return
      applyVehicleCacheUpdate(queryClient, vehicle, { isCreate: true })
    },
  })
}
