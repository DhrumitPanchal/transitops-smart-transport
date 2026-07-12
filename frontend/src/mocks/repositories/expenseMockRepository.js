import { ApiError } from '../../api/apiError'
import { mockDelay } from '../mockDelay'
import { getDb } from '../db'
import {
  applySearch,
  applySort,
  createId,
  paginateItems,
  singleResponse,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'

function findExpenseOrThrow(id) {
  const record = getDb().expenses.find((item) => item.id === id)
  if (!record) {
    throw new ApiError({
      status: 404,
      code: 'EXPENSE_NOT_FOUND',
      message: 'Expense not found',
    })
  }
  return record
}

export const expenseMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().expenses]
    if (query.expenseType) {
      items = items.filter((item) => item.expenseType === query.expenseType)
    }
    items = applySearch(items, query, ['description', 'id'])
    items = applySort(items, query, 'expenseDate')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(findExpenseOrThrow(id))
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()

    if (
      payload.vehicleId &&
      !db.vehicles.some((item) => item.id === payload.vehicleId)
    ) {
      throw new ApiError({
        status: 400,
        code: 'VEHICLE_REQUIRED',
        message: 'Vehicle not found',
        fieldErrors: { vehicleId: 'Vehicle not found' },
      })
    }

    const record = {
      id: createId('exp'),
      vehicleId: payload.vehicleId || null,
      tripId: payload.tripId || null,
      expenseType: payload.expenseType,
      amount: Number(payload.amount),
      expenseDate: payload.expenseDate,
      description: String(payload.description || '').trim(),
      createdAt: new Date().toISOString(),
    }

    db.expenses.unshift(record)
    return singleResponse(record)
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const record = findExpenseOrThrow(id)

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

    return singleResponse(record)
  },

  async remove(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const index = db.expenses.findIndex((item) => item.id === id)

    if (index < 0) {
      throw new ApiError({
        status: 404,
        code: 'EXPENSE_NOT_FOUND',
        message: 'Expense not found',
      })
    }

    const [removed] = db.expenses.splice(index, 1)
    return singleResponse(removed)
  },
}
