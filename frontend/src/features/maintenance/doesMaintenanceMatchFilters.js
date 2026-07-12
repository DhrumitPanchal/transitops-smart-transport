import { parseDateValue } from '../../utils/dateHelpers'

export function doesMaintenanceMatchFilters(record, filters = {}) {
  if (!record) return false

  const search = String(filters.search || '')
    .trim()
    .toLowerCase()

  if (search) {
    const haystack = [
      record.title,
      record.description,
      record.serviceCenter,
      record.vendorName,
      record.remarks,
      record.id,
      record.maintenanceNumber,
      record.vehicleRegistration,
      record.vehicleName,
      record.vehicle?.registrationNumber,
      record.vehicle?.vehicleName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.status && record.status !== filters.status) {
    return false
  }

  if (
    filters.maintenanceType &&
    record.maintenanceType !== filters.maintenanceType
  ) {
    return false
  }

  if (filters.vehicleId && record.vehicleId !== filters.vehicleId) {
    return false
  }

  if (filters.dateFrom || filters.dateTo) {
    const start = parseDateValue(record.scheduledDate || record.startDate)
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
