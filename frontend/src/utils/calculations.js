export function calculateFuelEfficiency(distanceKm, fuelLiters) {
  if (!fuelLiters || fuelLiters <= 0) return 0
  return Number((distanceKm / fuelLiters).toFixed(2))
}

export function calculateTripCost(distanceKm, costPerKm) {
  return Number((distanceKm * costPerKm).toFixed(2))
}

export function calculatePercentage(part, total) {
  if (!total || total <= 0) return 0
  return Number(((part / total) * 100).toFixed(1))
}

export function sumBy(items = [], key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0)
}
