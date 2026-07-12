import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as vehicleService from '../../services/vehicleService'
import { applyVehicleCacheUpdate } from '../../features/vehicles/vehicleQueryCache'

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => vehicleService.update(id, payload),
    onSuccess: (response) => {
      const vehicle = response?.data
      if (!vehicle) return
      applyVehicleCacheUpdate(queryClient, vehicle, { isCreate: false })
    },
  })
}
