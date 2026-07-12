import { z } from 'zod'
import { EXPENSE_TYPES } from '../constants/appConstants'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  dateField,
  numberField,
  oneOfEnum,
  optionalText,
  trimmedText,
} from './common'

export const expenseSchema = z.object({
  vehicleId: optionalText(),
  tripId: optionalText(),
  expenseType: oneOfEnum(
    Object.values(EXPENSE_TYPES),
    VALIDATION_MESSAGES.EXPENSE_TYPE_REQUIRED,
  ),
  amount: numberField({
    exclusiveMin: true,
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.AMOUNT_POSITIVE,
    minMessage: VALIDATION_MESSAGES.AMOUNT_POSITIVE,
  }),
  expenseDate: dateField({
    requiredMessage: VALIDATION_MESSAGES.EXPENSE_DATE_REQUIRED,
  }),
  description: trimmedText({
    min: 3,
    max: 500,
    requiredMessage: VALIDATION_MESSAGES.DESCRIPTION_REQUIRED,
    minMessage: VALIDATION_MESSAGES.DESCRIPTION_LENGTH,
    maxMessage: VALIDATION_MESSAGES.DESCRIPTION_LENGTH,
  }),
})
