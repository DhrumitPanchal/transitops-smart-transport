export const DEFAULT_EXPENSE_FORM_VALUES = {
  vehicleId: '',
  tripId: '',
  expenseType: '',
  amount: '',
  expenseDate: '',
  description: '',
}

export function normalizeExpensePayload(values = {}) {
  return {
    vehicleId: values.vehicleId || null,
    tripId: values.tripId || null,
    expenseType: values.expenseType,
    amount: values.amount,
    expenseDate: values.expenseDate,
    description: values.description || '',
  }
}
