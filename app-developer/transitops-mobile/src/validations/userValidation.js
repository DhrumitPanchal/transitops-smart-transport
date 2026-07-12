import { z } from 'zod'
import { USER_FORM_STATUSES } from '../constants/formOptions'
import { ROLES } from '../constants/roles'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  emailField,
  oneOfEnum,
  passwordField,
  trimmedText,
} from './common'

export const userCreateSchema = z
  .object({
    name: trimmedText({
      min: 2,
      max: 100,
      requiredMessage: VALIDATION_MESSAGES.NAME_REQUIRED,
      minMessage: VALIDATION_MESSAGES.NAME_MIN,
      maxMessage: VALIDATION_MESSAGES.NAME_MAX,
    }),
    email: emailField,
    role: oneOfEnum(Object.values(ROLES), VALIDATION_MESSAGES.ROLE_INVALID),
    status: oneOfEnum(
      USER_FORM_STATUSES,
      VALIDATION_MESSAGES.STATUS_INVALID,
    ),
    password: passwordField,
    confirmPassword: z.preprocess(
      (value) => String(value ?? '').trim(),
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

export const userEditSchema = z.object({
  name: trimmedText({
    min: 2,
    max: 100,
    requiredMessage: VALIDATION_MESSAGES.NAME_REQUIRED,
    minMessage: VALIDATION_MESSAGES.NAME_MIN,
    maxMessage: VALIDATION_MESSAGES.NAME_MAX,
  }),
  email: emailField,
  role: oneOfEnum(Object.values(ROLES), VALIDATION_MESSAGES.ROLE_INVALID),
  status: oneOfEnum(USER_FORM_STATUSES, VALIDATION_MESSAGES.STATUS_INVALID),
})

/** Compatibility export for older imports. Prefer userCreateSchema. */
export const userSchema = userCreateSchema
