import { keysToCamelCase } from './caseMapper'
import {
  mapLifecycleResponse,
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'
import { fromApi as vehicleFromApi } from './vehicleMapper'

/**
 * Normalize backend maintenance records for UI usage.
 * Backend fields are the source of truth; legacy mock aliases are derived.
 */
export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  return {
    ...mapped,
    maintenanceType: mapped.maintenanceType || mapped.type || null,
    title: mapped.title || mapped.description || '',
    serviceCenter: mapped.serviceCenter || mapped.vendorName || '',
    scheduledDate: mapped.scheduledDate || mapped.startDate || null,
    estimatedCost: mapped.estimatedCost ?? mapped.cost ?? null,
    remarks: mapped.remarks ?? mapped.notes ?? null,
    // Legacy aliases used by older UI/mock code paths
    startDate: mapped.scheduledDate || mapped.startDate || null,
    cost: mapped.estimatedCost ?? mapped.actualCost ?? mapped.cost ?? null,
    vendorName: mapped.serviceCenter || mapped.vendorName || '',
    notes: mapped.remarks ?? mapped.notes ?? null,
  }
}

/**
 * Map UI/form payload to backend create/update body.
 */
export function toApi(entity) {
  if (entity == null) return entity

  const {
    maintenanceType,
    type,
    title,
    description,
    serviceCenter,
    vendorName,
    scheduledDate,
    startDate,
    estimatedCost,
    cost,
    currentOdometer,
    nextServiceOdometer,
    remarks,
    notes,
    vehicleId,
    status,
    // strip UI-only / legacy fields
    expectedEndDate,
    ...rest
  } = entity

  const payload = {
    ...rest,
    vehicleId,
    maintenanceType: maintenanceType || type,
    title:
      title ||
      description ||
      (maintenanceType || type
        ? `${maintenanceType || type} maintenance`
        : 'Maintenance'),
    description: description || undefined,
    serviceCenter: serviceCenter || vendorName,
    scheduledDate: scheduledDate || startDate,
    estimatedCost:
      estimatedCost != null && estimatedCost !== ''
        ? Number(estimatedCost)
        : cost != null && cost !== ''
          ? Number(cost)
          : undefined,
    currentOdometer:
      currentOdometer != null && currentOdometer !== ''
        ? Number(currentOdometer)
        : undefined,
    nextServiceOdometer:
      nextServiceOdometer != null && nextServiceOdometer !== ''
        ? Number(nextServiceOdometer)
        : undefined,
    remarks: remarks ?? notes ?? undefined,
  }

  // Backend create always starts as SCHEDULED; do not send status.
  delete payload.status
  delete payload.expectedEndDate
  delete payload.startDate
  delete payload.cost
  delete payload.vendorName
  delete payload.notes
  delete payload.type

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === '') {
      delete payload[key]
    }
  })

  return payload
}

export function fromApiList(payload) {
  return mapListResponse(payload, fromApi)
}

export function fromApiDetail(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function fromApiLifecycle(payload) {
  return mapLifecycleResponse(payload, {
    maintenance: fromApi,
    vehicle: vehicleFromApi,
  })
}

export function toApiRequest(payload) {
  return toApiBody(toApi(payload))
}

export function toApiQuery(params) {
  return toApiParams(params)
}
