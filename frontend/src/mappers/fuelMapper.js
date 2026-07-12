import { keysToCamelCase } from './caseMapper'
import {
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'

export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  const liters = mapped.liters ?? mapped.quantity
  const cost = mapped.cost ?? mapped.totalAmount
  const pricePerUnit = mapped.pricePerUnit ?? mapped.costPerLitre
  const costPerLitre =
    mapped.costPerLitre ??
    (liters && Number(liters) > 0
      ? Number(cost || 0) / Number(liters)
      : pricePerUnit)

  return {
    ...mapped,
    liters: liters != null ? Number(liters) : liters,
    quantity: mapped.quantity ?? liters,
    cost: cost != null ? Number(cost) : cost,
    totalAmount: mapped.totalAmount ?? cost,
    costPerLitre: costPerLitre != null ? Number(costPerLitre) : costPerLitre,
    pricePerUnit: pricePerUnit != null ? Number(pricePerUnit) : pricePerUnit,
    stationName: mapped.stationName || mapped.fuelStation || '',
    fuelStation: mapped.fuelStation || mapped.stationName || '',
    odometerReading:
      mapped.odometerReading != null
        ? Number(mapped.odometerReading)
        : mapped.odometerReading,
  }
}

export function toApi(entity) {
  return entity
}

export function fromApiList(payload) {
  return mapListResponse(payload, fromApi)
}

export function fromApiDetail(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function toApiRequest(payload = {}) {
  if (payload == null || typeof payload !== 'object') return payload
  const body = { ...toApiBody(payload) }

  if (body.liters != null && body.quantity == null) {
    body.quantity = body.liters
  }
  if (body.cost != null && body.totalAmount == null) {
    body.totalAmount = body.cost
  }
  if (body.stationName != null && body.fuelStation == null) {
    body.fuelStation = body.stationName
  }
  if (body.costPerLitre != null && body.pricePerUnit == null) {
    body.pricePerUnit = body.costPerLitre
  }

  return body
}

export function toApiQuery(params = {}) {
  const query = toApiParams(params)
  if (query.sortBy === 'cost') query.sortBy = 'totalAmount'
  if (query.sortBy === 'liters') query.sortBy = 'quantity'
  if (query.sortBy === 'stationName') query.sortBy = 'fuelStation'
  return query
}
