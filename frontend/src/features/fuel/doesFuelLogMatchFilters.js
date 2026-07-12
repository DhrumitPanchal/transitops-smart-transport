import { parseDateValue } from '../../utils/dateHelpers'

export function doesFuelLogMatchFilters(record, filters = {}) {
  if (!record) return false

  const search = String(filters.search || '')
    .trim()
    .toLowerCase()

  if (search) {
    const haystack = [
      record.stationName,
      record.notes,
      record.id,
      record.vehicleRegistration,
      record.vehicleName,
      record.tripNumber,
      record.vehicle?.registrationNumber,
      record.vehicle?.vehicleName,
      record.trip?.tripNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.vehicleId && record.vehicleId !== filters.vehicleId) {
    return false
  }

  if (filters.tripId && record.tripId !== filters.tripId) {
    return false
  }

  if (filters.dateFrom || filters.dateTo) {
    const start = parseDateValue(record.fuelDate)
    if (!start) return false

    if (filters.dateFrom) {
      const from = parseDateValue(filters.dateFrom)
      if (from && start < from) return false
    }

    if (filters.dateTo) {
      const to = parseDateValue(filters.dateTo)
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (start > end) return false
      }
    }
  }

  return true
}
