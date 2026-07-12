import { z } from 'zod'
import { VEHICLE_TYPES } from '../constants/appConstants'
import { VEHICLE_FORM_STATUSES } from '../constants/formOptions'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import {
  numberField,
  oneOfEnum,
  trimmedText,
  uppercaseText,
} from './common'

export const vehicleSchema = z.object({
  registrationNumber: uppercaseText({
    min: 3,
    max: 20,
    requiredMessage: VALIDATION_MESSAGES.REGISTRATION_REQUIRED,
    minMessage: VALIDATION_MESSAGES.REGISTRATION_LENGTH,
    maxMessage: VALIDATION_MESSAGES.REGISTRATION_LENGTH,
  }),
  vehicleName: trimmedText({
    min: 2,
    max: 100,
    requiredMessage: VALIDATION_MESSAGES.VEHICLE_NAME_REQUIRED,
    minMessage: VALIDATION_MESSAGES.VEHICLE_NAME_LENGTH,
    maxMessage: VALIDATION_MESSAGES.VEHICLE_NAME_LENGTH,
  }),
  model: trimmedText({
    min: 1,
    max: 100,
    requiredMessage: VALIDATION_MESSAGES.MODEL_REQUIRED,
    maxMessage: VALIDATION_MESSAGES.MODEL_MAX,
  }),
  vehicleType: oneOfEnum(
    Object.values(VEHICLE_TYPES),
    VALIDATION_MESSAGES.VEHICLE_TYPE_INVALID,
  ),
  maxLoadCapacity: numberField({
    exclusiveMin: true,
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.CAPACITY_POSITIVE,
    minMessage: VALIDATION_MESSAGES.CAPACITY_POSITIVE,
  }),
  odometer: numberField({
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.ODOMETER_MIN,
    minMessage: VALIDATION_MESSAGES.ODOMETER_MIN,
  }),
  acquisitionCost: numberField({
    min: 0,
    requiredMessage: VALIDATION_MESSAGES.ACQUISITION_COST_MIN,
    minMessage: VALIDATION_MESSAGES.ACQUISITION_COST_MIN,
  }),
  region: trimmedText({
    min: 1,
    max: 100,
    requiredMessage: VALIDATION_MESSAGES.REGION_REQUIRED,
    maxMessage: VALIDATION_MESSAGES.REGION_MAX,
  }),
  status: oneOfEnum(
    VEHICLE_FORM_STATUSES,
    VALIDATION_MESSAGES.VEHICLE_STATUS_MANUAL,
  ),
})

export const vehicleUpdateSchema = vehicleSchema
