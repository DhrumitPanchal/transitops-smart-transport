import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'

export const fuelSchema = z.object({
  vehicleId: z.string().min(1, VALIDATION_MESSAGES.VEHICLE_REQUIRED),
  liters: z.coerce.number().positive(VALIDATION_MESSAGES.LITERS_POSITIVE),
  cost: z.coerce.number().positive(VALIDATION_MESSAGES.COST_POSITIVE),
  filledAt: z.string().min(1, VALIDATION_MESSAGES.FILL_DATE_REQUIRED),
})
