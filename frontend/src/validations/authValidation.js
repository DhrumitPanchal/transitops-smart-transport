import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'

export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(6, VALIDATION_MESSAGES.PASSWORD_MIN),
})
