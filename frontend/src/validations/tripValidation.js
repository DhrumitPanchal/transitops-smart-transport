import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { TRIP_STATUS } from '../constants/statuses'

export const tripSchema = z.object({
  route: z.string().min(2, VALIDATION_MESSAGES.ROUTE_REQUIRED),
  vehicleId: z.string().min(1, VALIDATION_MESSAGES.VEHICLE_REQUIRED),
  driverId: z.string().min(1, VALIDATION_MESSAGES.DRIVER_REQUIRED),
  scheduledAt: z.string().min(1, VALIDATION_MESSAGES.SCHEDULE_REQUIRED),
  status: z.enum(Object.values(TRIP_STATUS), {
    message: VALIDATION_MESSAGES.STATUS_REQUIRED,
  }),
})
