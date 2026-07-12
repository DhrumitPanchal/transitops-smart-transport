import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { EXPENSE_TYPES } from '../constants/appConstants'

export const expenseSchema = z.object({
  category: z.enum(Object.values(EXPENSE_TYPES), {
    message: VALIDATION_MESSAGES.CATEGORY_REQUIRED,
  }),
  amount: z.coerce.number().positive(VALIDATION_MESSAGES.AMOUNT_POSITIVE),
  date: z.string().min(1, VALIDATION_MESSAGES.DATE_REQUIRED),
})
