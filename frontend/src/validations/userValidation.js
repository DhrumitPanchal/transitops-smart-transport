import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { ROLES } from '../constants/roles'
import { USER_STATUS } from '../constants/statuses'

export const userSchema = z.object({
  name: z.string().min(2, VALIDATION_MESSAGES.NAME_MIN),
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
  role: z.enum(Object.values(ROLES), {
    message: VALIDATION_MESSAGES.ROLE_REQUIRED,
  }),
  status: z.enum(Object.values(USER_STATUS), {
    message: VALIDATION_MESSAGES.STATUS_REQUIRED,
  }),
})
