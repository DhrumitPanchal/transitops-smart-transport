import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { DRIVER_STATUS } from '../constants/statuses'
import { LICENCE_CATEGORIES } from '../constants/appConstants'

export const driverSchema = z.object({
  name: z.string().min(2, VALIDATION_MESSAGES.NAME_MIN),
  licenseNumber: z.string().min(3, VALIDATION_MESSAGES.LICENSE_REQUIRED),
  licenceCategory: z.enum(Object.values(LICENCE_CATEGORIES), {
    message: VALIDATION_MESSAGES.REQUIRED,
  }),
  phone: z.string().min(8, VALIDATION_MESSAGES.PHONE_REQUIRED),
  status: z.enum(Object.values(DRIVER_STATUS), {
    message: VALIDATION_MESSAGES.STATUS_REQUIRED,
  }),
})
