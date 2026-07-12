function normalizeSearch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function doesVehicleMatchFilters(vehicle, filters = {}) {
  if (!vehicle) return false

  const search = normalizeSearch(filters.search)
  if (search) {
    const haystack = [
      vehicle.registrationNumber,
      vehicle.vehicleName,
      vehicle.model,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.vehicleType && vehicle.vehicleType !== filters.vehicleType) {
    return false
  }

  if (filters.status && vehicle.status !== filters.status) {
    return false
  }

  if (filters.region && vehicle.region !== filters.region) {
    return false
  }

  return true
}
