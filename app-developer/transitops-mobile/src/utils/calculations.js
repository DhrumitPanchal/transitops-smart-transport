function toFiniteNumber(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function safeDivide(numerator, denominator) {
  const top = toFiniteNumber(numerator)
  const bottom = toFiniteNumber(denominator)
  if (top == null || bottom == null || bottom === 0) return 0
  return top / bottom
}

export function calculateFuelEfficiency(distanceKm, fuelLiters) {
  const efficiency = safeDivide(distanceKm, fuelLiters)
  return Number(efficiency.toFixed(2))
}

export function calculateTripCost(distanceKm, costPerKm) {
  const distance = toFiniteNumber(distanceKm) || 0
  const rate = toFiniteNumber(costPerKm) || 0
  return Number((distance * rate).toFixed(2))
}

export function calculatePercentage(part, total) {
  const percentage = safeDivide(part, total) * 100
  return Number(percentage.toFixed(1))
}

export function calculateFleetUtilization(activeVehicles, totalVehicles) {
  return calculatePercentage(activeVehicles, totalVehicles)
}

export function calculateOperationalCost({
  fuelCost = 0,
  maintenanceCost = 0,
  expenseCost = 0,
} = {}) {
  const fuel = toFiniteNumber(fuelCost) || 0
  const maintenance = toFiniteNumber(maintenanceCost) || 0
  const expenses = toFiniteNumber(expenseCost) || 0
  return Number((fuel + maintenance + expenses).toFixed(2))
}

export function calculateVehicleRoi({
  revenue = 0,
  acquisitionCost = 0,
  operationalCost = 0,
} = {}) {
  const income = toFiniteNumber(revenue) || 0
  const acquisition = toFiniteNumber(acquisitionCost) || 0
  const operating = toFiniteNumber(operationalCost) || 0
  const investment = acquisition + operating

  if (investment <= 0) return 0

  const roi = ((income - investment) / investment) * 100
  return Number(roi.toFixed(2))
}

export function sumBy(items = [], key) {
  return items.reduce((total, item) => {
    const value = toFiniteNumber(item?.[key]) || 0
    return total + value
  }, 0)
}
