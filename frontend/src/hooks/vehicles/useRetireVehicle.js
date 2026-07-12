import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as vehicleService from '../../services/vehicleService'
import { applyVehicleRetireToCache } from '../../features/vehicles/vehicleQueryCache'

export function useRetireVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => vehicleService.retire(id),
    onSuccess: (response) => {
      const vehicle = response?.data
      if (!vehicle) return
      applyVehicleRetireToCache(queryClient, vehicle)
    },
  })
}
