import { z } from 'zod'
import { LICENCE_CATEGORIES } from '../constants/appConstants'
import { DRIVER_FORM_STATUSES } from '../constants/formOptions'
import { DRIVER_STATUS } from '../constants/statuses'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { isLicenseExpired } from '../utils/dateHelpers'
import {
  dateField,
  numberField,
  oneOfEnum,
  trimmedText,
  uppercaseText,
} from './common'

const contactPattern = /^[0-9+\-\s()]+$/

export const driverSchema = z
  .object({
    name: trimmedText({
      min: 2,
      max: 100,
      requiredMessage: VALIDATION_MESSAGES.NAME_REQUIRED,
      minMessage: VALIDATION_MESSAGES.NAME_MIN,
      maxMessage: VALIDATION_MESSAGES.NAME_MAX,
    }),
    licenseNumber: uppercaseText({
      min: 1,
      max: 50,
      requiredMessage: VALIDATION_MESSAGES.LICENSE_REQUIRED,
      maxMessage: VALIDATION_MESSAGES.LICENSE_MAX,
    }),
    licenseCategory: oneOfEnum(
      Object.values(LICENCE_CATEGORIES),
      VALIDATION_MESSAGES.LICENSE_CATEGORY_REQUIRED,
    ),
    licenseExpiryDate: dateField({
      requiredMessage: VALIDATION_MESSAGES.LICENSE_EXPIRY_REQUIRED,
      invalidMessage: VALIDATION_MESSAGES.LICENSE_EXPIRY_INVALID,
    }),
    contactNumber: trimmedText({
      min: 8,
      max: 20,
      requiredMessage: VALIDATION_MESSAGES.CONTACT_REQUIRED,
      minMessage: VALIDATION_MESSAGES.CONTACT_LENGTH,
      maxMessage: VALIDATION_MESSAGES.CONTACT_LENGTH,
    }).refine((value) => contactPattern.test(value), {
      message: VALIDATION_MESSAGES.CONTACT_INVALID,
    }),
    safetyScore: numberField({
      min: 0,
      max: 100,
      requiredMessage: VALIDATION_MESSAGES.SAFETY_SCORE_RANGE,
      minMessage: VALIDATION_MESSAGES.SAFETY_SCORE_RANGE,
      maxMessage: VALIDATION_MESSAGES.SAFETY_SCORE_RANGE,
    }),
    status: oneOfEnum(
      DRIVER_FORM_STATUSES,
      VALIDATION_MESSAGES.DRIVER_STATUS_MANUAL,
    ),
  })
  .superRefine((values, ctx) => {
    if (
      values.status === DRIVER_STATUS.AVAILABLE &&
      isLicenseExpired(values.licenseExpiryDate)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: VALIDATION_MESSAGES.LICENSE_EXPIRED_AVAILABLE,
      })
    }
  })
