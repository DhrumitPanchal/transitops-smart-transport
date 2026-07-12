import { parseDateValue } from '../../utils/dateHelpers'
import { mockDelay } from '../mockDelay'
import { ensureMockDbReady, getDb, persistDb } from '../mockDatabase'
import {
  applySearch,
  applySort,
  createId,
  paginateItems,
  singleResponse,
  throwMockError,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findExpenseOrThrow(id) {
  const record = getDb().expenses.find((item) => item.id === id)
  if (!record) {
    throwMockError({
      status: 404,
      code: 'EXPENSE_NOT_FOUND',
      message: 'Expense not found',
    })
  }
  return record
}

function getVehicle(vehicleId) {
  if (!vehicleId) return null
  return getDb().vehicles.find((item) => item.id === vehicleId) || null
}

function getTrip(tripId) {
  if (!tripId) return null
  return getDb().trips.find((item) => item.id === tripId) || null
}

function enrichExpense(record) {
  const vehicle = getVehicle(record.vehicleId)
  const trip = getTrip(record.tripId)
  return {
    ...record,
    vehicle,
    trip,
    vehicleRegistration: vehicle?.registrationNumber || null,
    vehicleName: vehicle?.vehicleName || null,
    tripNumber: trip?.tripNumber || null,
  }
}

function inDateRange(dateValue, dateFrom, dateTo) {
  const start = parseDateValue(dateValue)
  if (!start) return true

  if (dateFrom) {
    const from = parseDateValue(dateFrom)
    if (from && start < from) return false
  }

  if (dateTo) {
    const to = parseDateValue(dateTo)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      if (start > end) return false
    }
  }

  return true
}

export const expenseMockRepository = {
  async list(query = {}) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().expenses]

    if (query.expenseType) {
      items = items.filter((item) => item.expenseType === query.expenseType)
    }

    if (query.vehicleId) {
      items = items.filter((item) => item.vehicleId === query.vehicleId)
    }

    if (query.tripId) {
      items = items.filter((item) => item.tripId === query.tripId)
    }

    if (query.dateFrom || query.dateTo) {
      items = items.filter((item) =>
        inDateRange(item.expenseDate, query.dateFrom, query.dateTo),
      )
    }

    const term = String(query.search || '')
      .trim()
      .toLowerCase()
    if (term) {
      items = items.filter((item) => {
        const vehicle = getVehicle(item.vehicleId)
        const trip = getTrip(item.tripId)
        const haystack = [
          item.description,
          item.expenseType,
          item.id,
          vehicle?.registrationNumber,
          vehicle?.vehicleName,
          trip?.tripNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
    } else {
      items = applySearch(items, query, ['description', 'id'])
    }

    items = applySort(items, query, 'expenseDate')
    return paginateItems(
      items.map((item) => enrichExpense(item)),
      query,
    )
  },

  async getById(id) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(enrichExpense(findExpenseOrThrow(id)))
  },

  async create(payload) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()

    if (
      payload.vehicleId &&
      !db.vehicles.some((item) => item.id === payload.vehicleId)
    ) {
      throwMockError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle not found',
        fieldErrors: { vehicleId: 'Vehicle not found' },
      })
    }

    if (
      payload.tripId &&
      !db.trips.some((item) => item.id === payload.tripId)
    ) {
      throwMockError({
        status: 400,
        code: 'TRIP_NOT_FOUND',
        message: 'Trip not found',
        fieldErrors: { tripId: 'Trip not found' },
      })
    }

    const now = new Date().toISOString()
    const record = {
      id: createId('exp'),
      vehicleId: payload.vehicleId || null,
      tripId: payload.tripId || null,
      expenseType: payload.expenseType,
      amount: Number(payload.amount),
      expenseDate: payload.expenseDate,
      description: String(payload.description || '').trim(),
      createdAt: now,
      updatedAt: now,
    }

    db.expenses.unshift(record)
    await persistDb()
    return singleResponse(enrichExpense(record), 'Expense created successfully.')
  },

  async update(id, payload) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const record = findExpenseOrThrow(id)

    if (
      payload.tripId &&
      !db.trips.some((item) => item.id === payload.tripId)
    ) {
      throwMockError({
        status: 400,
        code: 'TRIP_NOT_FOUND',
        message: 'Trip not found',
        fieldErrors: { tripId: 'Trip not found' },
      })
    }

    Object.assign(record, {
      vehicleId:
        payload.vehicleId === undefined
          ? record.vehicleId
          : payload.vehicleId || null,
      tripId:
        payload.tripId === undefined ? record.tripId : payload.tripId || null,
      expenseType: payload.expenseType ?? record.expenseType,
      amount: Number(payload.amount ?? record.amount),
      expenseDate: payload.expenseDate ?? record.expenseDate,
      description: String(payload.description ?? record.description).trim(),
      updatedAt: new Date().toISOString(),
    })

    await persistDb()
    return singleResponse(enrichExpense(record))
  },

  async remove(id) {
    await ensureMockDbReady()
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const index = db.expenses.findIndex((item) => item.id === id)

    if (index < 0) {
      throwMockError({
        status: 404,
        code: 'EXPENSE_NOT_FOUND',
        message: 'Expense not found',
      })
    }

    const [removed] = db.expenses.splice(index, 1)
    await persistDb()
    return singleResponse(enrichExpense(removed), 'Expense deleted successfully.')
  },
}
