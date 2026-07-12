import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  dateField,
  numberField,
  optionalText,
  trimmedText,
} from './common'

export const fuelSchema = z.object({
  vehicleId: trimmedText({
    requiredMessage: VALIDATION_MESSAGES.VEHICLE_REQUIRED,
  }),
  tripId: optionalText(),
  liters: numberField({
    exclusiveMin: true,
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.LITERS_POSITIVE,
    minMessage: VALIDATION_MESSAGES.LITERS_POSITIVE,
  }),
  cost: numberField({
    exclusiveMin: true,
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.COST_POSITIVE,
    minMessage: VALIDATION_MESSAGES.COST_POSITIVE,
  }),
  fuelDate: dateField({
    requiredMessage: VALIDATION_MESSAGES.FUEL_DATE_REQUIRED,
  }),
  odometerReading: numberField({
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.ODOMETER_READING_MIN,
    minMessage: VALIDATION_MESSAGES.ODOMETER_READING_MIN,
  }),
  stationName: optionalText({ max: 100 }),
  notes: optionalText({ max: 500 }),
})
