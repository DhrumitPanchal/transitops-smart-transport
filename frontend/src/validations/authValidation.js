import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  emailField,
  passwordField,
  toLowerEmail,
  trimString,
  trimmedText,
} from './common'

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const registerSchema = z
  .object({
    name: trimmedText({
      min: 2,
      max: 100,
      requiredMessage: VALIDATION_MESSAGES.NAME_REQUIRED,
      minMessage: VALIDATION_MESSAGES.NAME_MIN,
      maxMessage: VALIDATION_MESSAGES.NAME_MAX,
    }),
    email: z.preprocess(
      toLowerEmail,
      z
        .string()
        .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
        .email(VALIDATION_MESSAGES.EMAIL_INVALID)
        .max(150, 'Email must be at most 150 characters'),
    ),
    password: z.preprocess(
      trimString,
      z
        .string()
        .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED)
        .min(6, VALIDATION_MESSAGES.PASSWORD_MIN)
        .max(100, 'Password must be at most 100 characters'),
    ),
    confirmPassword: z.preprocess(
      trimString,
      z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
    ),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
      })
    }
  })
