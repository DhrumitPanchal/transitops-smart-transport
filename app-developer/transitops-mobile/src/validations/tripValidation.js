import { z } from 'zod'
import { VEHICLE_STATUS, DRIVER_STATUS } from '../constants/statuses'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { isLicenseExpired } from '../utils/dateHelpers'
import { numberField, trimmedText } from './common'

export const tripSchema = z
  .object({
    source: trimmedText({
      min: 2,
      max: 150,
      requiredMessage: VALIDATION_MESSAGES.SOURCE_REQUIRED,
      minMessage: VALIDATION_MESSAGES.SOURCE_LENGTH,
      maxMessage: VALIDATION_MESSAGES.SOURCE_LENGTH,
    }),
    destination: trimmedText({
      min: 2,
      max: 150,
      requiredMessage: VALIDATION_MESSAGES.DESTINATION_REQUIRED,
      minMessage: VALIDATION_MESSAGES.DESTINATION_LENGTH,
      maxMessage: VALIDATION_MESSAGES.DESTINATION_LENGTH,
    }),
    vehicleId: trimmedText({
      requiredMessage: VALIDATION_MESSAGES.VEHICLE_REQUIRED,
    }),
    driverId: trimmedText({
      requiredMessage: VALIDATION_MESSAGES.DRIVER_REQUIRED,
    }),
    cargoWeight: numberField({
      exclusiveMin: true,
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.CARGO_POSITIVE,
      minMessage: VALIDATION_MESSAGES.CARGO_POSITIVE,
    }),
    plannedDistance: numberField({
      exclusiveMin: true,
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.DISTANCE_POSITIVE,
      minMessage: VALIDATION_MESSAGES.DISTANCE_POSITIVE,
    }),
    revenue: numberField({
      required: false,
      min: 0,
      minMessage: VALIDATION_MESSAGES.REVENUE_MIN,
    }),
  })
  .superRefine((values, ctx) => {
    if (
      values.source &&
      values.destination &&
      values.source.toLowerCase() === values.destination.toLowerCase()
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['destination'],
        message: VALIDATION_MESSAGES.DESTINATION_SAME,
      })
    }
  })

export function validateTripResources(values, selectedVehicle, selectedDriver) {
  const errors = {}

  if (!selectedVehicle) {
    errors.vehicleId = VALIDATION_MESSAGES.VEHICLE_NOT_FOUND
  } else if (selectedVehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    errors.vehicleId = VALIDATION_MESSAGES.VEHICLE_NOT_AVAILABLE
  } else if (
    values?.cargoWeight != null &&
    selectedVehicle.maxLoadCapacity != null &&
    Number(values.cargoWeight) > Number(selectedVehicle.maxLoadCapacity)
  ) {
    errors.cargoWeight = VALIDATION_MESSAGES.CARGO_EXCEEDS_CAPACITY
  }

  if (!selectedDriver) {
    errors.driverId = VALIDATION_MESSAGES.DRIVER_NOT_FOUND
  } else if (selectedDriver.status !== DRIVER_STATUS.AVAILABLE) {
    errors.driverId = VALIDATION_MESSAGES.DRIVER_NOT_AVAILABLE
  } else if (isLicenseExpired(selectedDriver.licenseExpiryDate)) {
    errors.driverId = VALIDATION_MESSAGES.DRIVER_LICENSE_EXPIRED
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  }
}

export function createTripCompletionSchema(startOdometer) {
  const start = Number(startOdometer) || 0

  return z.object({
    finalOdometer: numberField({
      min: start,
      requiredMessage: VALIDATION_MESSAGES.FINAL_ODOMETER_REQUIRED,
      minMessage: VALIDATION_MESSAGES.FINAL_ODOMETER_MIN,
    }),
    fuelConsumed: numberField({
      exclusiveMin: true,
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.FUEL_CONSUMED_POSITIVE,
      minMessage: VALIDATION_MESSAGES.FUEL_CONSUMED_POSITIVE,
    }),
    fuelCost: numberField({
      min: 0,
      requiredMessage: VALIDATION_MESSAGES.FUEL_COST_MIN,
      minMessage: VALIDATION_MESSAGES.FUEL_COST_MIN,
    }),
    revenue: numberField({
      required: false,
      min: 0,
      minMessage: VALIDATION_MESSAGES.REVENUE_MIN,
    }),
  })
}

export const tripCancellationSchema = z.object({
  reason: trimmedText({
    min: 3,
    max: 500,
    requiredMessage: VALIDATION_MESSAGES.CANCEL_REASON_REQUIRED,
    minMessage: VALIDATION_MESSAGES.CANCEL_REASON_LENGTH,
    maxMessage: VALIDATION_MESSAGES.CANCEL_REASON_LENGTH,
  }),
})
