import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'

export function trimString(value) {
  if (value == null) return ''
  return String(value).trim()
}

export function toLowerEmail(value) {
  return trimString(value).toLowerCase()
}

export function toUpperCode(value) {
  return trimString(value).toUpperCase()
}

export function toSafeNumber(value) {
  if (value === '' || value == null) return undefined
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : Number.NaN
}

export function optionalTrimmed(value) {
  if (value == null) return undefined
  const trimmed = String(value).trim()
  return trimmed === '' ? undefined : trimmed
}

export const emailField = z.preprocess(
  toLowerEmail,
  z
    .string()
    .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL_INVALID),
)

export const passwordField = z.preprocess(
  trimString,
  z
    .string()
    .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED)
    .min(6, VALIDATION_MESSAGES.PASSWORD_MIN),
)

export function trimmedText({
  required = true,
  min,
  max,
  requiredMessage = VALIDATION_MESSAGES.REQUIRED,
  minMessage,
  maxMessage,
} = {}) {
  return z.preprocess(trimString, (() => {
    let schema = z.string()

    if (required || min != null) {
      const minimum = min != null ? min : 1
      schema = schema.min(minimum, minMessage || requiredMessage)
    }

    if (max != null) {
      schema = schema.max(max, maxMessage || VALIDATION_MESSAGES.INVALID)
    }

    return schema
  })())
}

export function optionalText({ max, maxMessage } = {}) {
  return z.preprocess(optionalTrimmed, (() => {
    if (max != null) {
      return z
        .string()
        .max(max, maxMessage || VALIDATION_MESSAGES.INVALID)
        .optional()
    }
    return z.string().optional()
  })())
}

export function uppercaseText({
  required = true,
  min,
  max,
  requiredMessage = VALIDATION_MESSAGES.REQUIRED,
  minMessage,
  maxMessage,
} = {}) {
  return z.preprocess(toUpperCode, (() => {
    let schema = z.string()

    if (required || min != null) {
      const minimum = min != null ? min : 1
      schema = schema.min(minimum, minMessage || requiredMessage)
    }

    if (max != null) {
      schema = schema.max(max, maxMessage || VALIDATION_MESSAGES.INVALID)
    }

    return schema
  })())
}

export function numberField({
  required = true,
  min,
  exclusiveMin = false,
  max,
  requiredMessage = VALIDATION_MESSAGES.REQUIRED,
  invalidMessage = VALIDATION_MESSAGES.INVALID_NUMBER,
  minMessage = VALIDATION_MESSAGES.INVALID_NUMBER,
  maxMessage = VALIDATION_MESSAGES.INVALID_NUMBER,
} = {}) {
  return z
    .any()
    .superRefine((raw, ctx) => {
      if (raw === '' || raw == null) {
        if (required) {
          ctx.addIssue({
            code: 'custom',
            message: requiredMessage,
          })
        }
        return
      }

      const value = toSafeNumber(raw)

      if (value == null || Number.isNaN(value)) {
        ctx.addIssue({
          code: 'custom',
          message: invalidMessage,
        })
        return
      }

      if (min != null) {
        const tooSmall = exclusiveMin ? value <= min : value < min
        if (tooSmall) {
          ctx.addIssue({
            code: 'custom',
            message: minMessage,
          })
          return
        }
      }

      if (max != null && value > max) {
        ctx.addIssue({
          code: 'custom',
          message: maxMessage,
        })
      }
    })
    .transform((raw) => {
      if (raw === '' || raw == null) return undefined
      return toSafeNumber(raw)
    })
}

export function dateField({
  required = true,
  requiredMessage = VALIDATION_MESSAGES.DATE_REQUIRED,
  invalidMessage = VALIDATION_MESSAGES.DATE_INVALID,
} = {}) {
  return z
    .any()
    .superRefine((raw, ctx) => {
      const value = optionalTrimmed(raw)

      if (!value) {
        if (required) {
          ctx.addIssue({
            code: 'custom',
            message: requiredMessage,
          })
        }
        return
      }

      if (Number.isNaN(Date.parse(value))) {
        ctx.addIssue({
          code: 'custom',
          message: invalidMessage,
        })
      }
    })
    .transform((raw) => optionalTrimmed(raw))
}

export function oneOfEnum(values, message = VALIDATION_MESSAGES.STATUS_INVALID) {
  const allowed = new Set(values)

  return z.preprocess(
    trimString,
    z
      .string()
      .min(1, VALIDATION_MESSAGES.STATUS_REQUIRED)
      .refine((value) => allowed.has(value), { message }),
  )
}
