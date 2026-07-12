import { z } from 'zod'
import { MAINTENANCE_TYPES } from '../constants/appConstants'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  dateField,
  numberField,
  oneOfEnum,
  optionalText,
  trimmedText,
} from './common'

export const maintenanceSchema = z.object({
  vehicleId: trimmedText({
    requiredMessage: VALIDATION_MESSAGES.VEHICLE_REQUIRED,
  }),
  maintenanceType: oneOfEnum(
    Object.values(MAINTENANCE_TYPES),
    VALIDATION_MESSAGES.MAINTENANCE_TYPE_REQUIRED,
  ),
  title: trimmedText({
    min: 2,
    max: 120,
    requiredMessage: 'Title is required',
    minMessage: 'Title must be at least 2 characters',
    maxMessage: 'Title must be at most 120 characters',
  }),
  description: optionalText({ max: 500 }),
  serviceCenter: trimmedText({
    min: 2,
    max: 120,
    requiredMessage: 'Service center is required',
    minMessage: 'Service center must be at least 2 characters',
    maxMessage: 'Service center must be at most 120 characters',
  }),
  scheduledDate: dateField({
    requiredMessage: VALIDATION_MESSAGES.START_DATE_REQUIRED,
  }),
  estimatedCost: numberField({
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.COST_MIN,
    minMessage: VALIDATION_MESSAGES.COST_MIN,
  }),
  currentOdometer: numberField({
    min: 0,
    requiredMessage: 'Current odometer is required',
    minMessage: 'Current odometer cannot be negative',
  }),
  nextServiceOdometer: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    numberField({
      min: 0,
      requiredMessage: 'Next service odometer is invalid',
      minMessage: 'Next service odometer cannot be negative',
    }).optional(),
  ),
  remarks: optionalText({ max: 500 }),
  status: z.literal('SCHEDULED').optional(),
})

export const maintenanceCancellationSchema = z.object({
  reason: trimmedText({
    min: 3,
    max: 500,
    requiredMessage: VALIDATION_MESSAGES.CANCEL_REASON_REQUIRED || 'Reason is required',
    minMessage: 'Reason must be at least 3 characters',
    maxMessage: 'Reason must be at most 500 characters',
  }),
})

export function createMaintenanceCompletionSchema() {
  return z.object({
    actualCost: numberField({
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.COST_MIN,
      minMessage: VALIDATION_MESSAGES.COST_MIN,
    }),
    completedDate: dateField({
      requiredMessage: VALIDATION_MESSAGES.EXPECTED_END_DATE_REQUIRED,
    }),
    nextServiceOdometer: z.preprocess(
      (value) => (value === '' || value == null ? undefined : value),
      numberField({
        min: 0,
        requiredMessage: 'Next service odometer is invalid',
        minMessage: 'Next service odometer cannot be negative',
      }).optional(),
    ),
    remarks: optionalText({ max: 500 }),
  })
}
