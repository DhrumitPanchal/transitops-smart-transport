import { z } from 'zod'
import { emailField, passwordField } from './common'

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
})
