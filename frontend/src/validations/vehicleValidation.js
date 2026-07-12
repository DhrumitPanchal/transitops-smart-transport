import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { VEHICLE_STATUS } from '../constants/statuses'
import { VEHICLE_TYPES } from '../constants/appConstants'

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(3, VALIDATION_MESSAGES.REGISTRATION_REQUIRED),
  make: z.string().min(1, VALIDATION_MESSAGES.MAKE_REQUIRED),
  model: z.string().min(1, VALIDATION_MESSAGES.MODEL_REQUIRED),
  type: z.enum(Object.values(VEHICLE_TYPES), {
    message: VALIDATION_MESSAGES.REQUIRED,
  }),
  year: z.coerce
    .number()
    .min(1990, VALIDATION_MESSAGES.YEAR_INVALID)
    .max(2100, VALIDATION_MESSAGES.YEAR_INVALID),
  status: z.enum(Object.values(VEHICLE_STATUS), {
    message: VALIDATION_MESSAGES.STATUS_REQUIRED,
  }),
})
