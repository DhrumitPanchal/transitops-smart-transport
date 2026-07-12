export const DEFAULT_FUEL_LOG_FORM_VALUES = {
  vehicleId: '',
  tripId: '',
  liters: '',
  cost: '',
  fuelDate: '',
  odometerReading: '',
  stationName: '',
  notes: '',
}

export function normalizeFuelLogPayload(values = {}) {
  return {
    vehicleId: values.vehicleId,
    tripId: values.tripId || null,
    liters: values.liters,
    cost: values.cost,
    fuelDate: values.fuelDate,
    odometerReading: values.odometerReading,
    stationName: values.stationName || '',
    notes: values.notes || '',
  }
}
