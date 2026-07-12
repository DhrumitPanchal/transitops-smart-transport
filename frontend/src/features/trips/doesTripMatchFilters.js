import { parseDateValue } from '../../utils/dateHelpers'

export function doesTripMatchFilters(trip, filters = {}) {
  if (!trip) return false

  const search = String(filters.search || '')
    .trim()
    .toLowerCase()

  if (search) {
    const haystack = [
      trip.tripNumber,
      trip.id,
      trip.source,
      trip.destination,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.status && trip.status !== filters.status) {
    return false
  }

  if (filters.vehicleId && trip.vehicleId !== filters.vehicleId) {
    return false
  }

  if (filters.driverId && trip.driverId !== filters.driverId) {
    return false
  }

  if (filters.dateFrom || filters.dateTo) {
    const created = parseDateValue(trip.createdAt)
    if (!created) return false

    if (filters.dateFrom) {
      const from = parseDateValue(filters.dateFrom)
      if (from && created < from) return false
    }

    if (filters.dateTo) {
      const to = parseDateValue(filters.dateTo)
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (created > end) return false
      }
    }
  }

  return true
}
