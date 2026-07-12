import { z } from 'zod'
import { MAINTENANCE_TYPES } from '../constants/appConstants'
import { MAINTENANCE_CREATE_STATUSES } from '../constants/formOptions'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  dateField,
  numberField,
  oneOfEnum,
  optionalText,
  trimmedText,
} from './common'

function isBeforeDate(left, right) {
  if (!left || !right) return false
  return new Date(left).getTime() < new Date(right).getTime()
}

export const maintenanceSchema = z
  .object({
    vehicleId: trimmedText({
      requiredMessage: VALIDATION_MESSAGES.VEHICLE_REQUIRED,
    }),
    maintenanceType: oneOfEnum(
      Object.values(MAINTENANCE_TYPES),
      VALIDATION_MESSAGES.MAINTENANCE_TYPE_REQUIRED,
    ),
    description: trimmedText({
      min: 3,
      max: 500,
      requiredMessage: VALIDATION_MESSAGES.DESCRIPTION_REQUIRED,
      minMessage: VALIDATION_MESSAGES.DESCRIPTION_LENGTH,
      maxMessage: VALIDATION_MESSAGES.DESCRIPTION_LENGTH,
    }),
    startDate: dateField({
      requiredMessage: VALIDATION_MESSAGES.START_DATE_REQUIRED,
    }),
    expectedEndDate: dateField({
      requiredMessage: VALIDATION_MESSAGES.EXPECTED_END_DATE_REQUIRED,
    }),
    cost: numberField({
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.COST_MIN,
      minMessage: VALIDATION_MESSAGES.COST_MIN,
    }),
    vendorName: optionalText({ max: 100 }),
    notes: optionalText({ max: 500 }),
    status: oneOfEnum(
      MAINTENANCE_CREATE_STATUSES,
      VALIDATION_MESSAGES.MAINTENANCE_STATUS_NEW,
    ),
  })
  .superRefine((values, ctx) => {
    if (
      values.startDate &&
      values.expectedEndDate &&
      isBeforeDate(values.expectedEndDate, values.startDate)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['expectedEndDate'],
        message: VALIDATION_MESSAGES.END_DATE_BEFORE_START,
      })
    }
  })

export function createMaintenanceCompletionSchema(startDate) {
  return z.object({
    completionDate: dateField({
      requiredMessage: VALIDATION_MESSAGES.COMPLETION_DATE_REQUIRED,
    }).refine(
      (value) => {
        if (!startDate || !value) return true
        return !isBeforeDate(value, startDate)
      },
      { message: VALIDATION_MESSAGES.COMPLETION_DATE_BEFORE_START },
    ),
    finalCost: numberField({
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.FINAL_COST_MIN,
      minMessage: VALIDATION_MESSAGES.FINAL_COST_MIN,
    }),
    notes: optionalText({ max: 500 }),
  })
}

export const maintenanceCancellationSchema = z.object({
  reason: trimmedText({
    min: 3,
    max: 500,
    requiredMessage: VALIDATION_MESSAGES.CANCEL_REASON_REQUIRED,
    minMessage: VALIDATION_MESSAGES.CANCEL_REASON_LENGTH,
    maxMessage: VALIDATION_MESSAGES.CANCEL_REASON_LENGTH,
  }),
})
