import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { MAINTENANCE_STATUS } from '../constants/statuses'
import { MAINTENANCE_TYPES } from '../constants/appConstants'

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, VALIDATION_MESSAGES.VEHICLE_REQUIRED),
  type: z.enum(Object.values(MAINTENANCE_TYPES), {
    message: VALIDATION_MESSAGES.MAINTENANCE_TYPE_REQUIRED,
  }),
  scheduledDate: z.string().min(1, VALIDATION_MESSAGES.SCHEDULED_DATE_REQUIRED),
  status: z.enum(Object.values(MAINTENANCE_STATUS), {
    message: VALIDATION_MESSAGES.STATUS_REQUIRED,
  }),
})
