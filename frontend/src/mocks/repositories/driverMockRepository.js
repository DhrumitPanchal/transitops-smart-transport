import { ApiError } from '../../api/apiError'
import { DRIVER_STATUS } from '../../constants/statuses'
import { isLicenseExpired } from '../../utils/dateHelpers'
import { mockDelay } from '../mockDelay'
import { getDb } from '../db'
import {
  applySearch,
  applySort,
  createId,
  normalizeCode,
  paginateItems,
  singleResponse,
} from '../mockHelpers'
import { authMockRepository } from './authMockRepository'
import { getLicenseCondition } from '../../features/drivers/doesDriverMatchFilters'

function findDriverOrThrow(id) {
  const driver = getDb().drivers.find((item) => item.id === id)
  if (!driver) {
    throw new ApiError({
      status: 404,
      code: 'DRIVER_NOT_FOUND',
      message: 'Driver not found',
    })
  }
  return driver
}

function assertManualStatus(status) {
  if (status === DRIVER_STATUS.ON_TRIP) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_STATUS',
      message: 'ON_TRIP cannot be selected manually',
      fieldErrors: { status: 'ON_TRIP cannot be selected manually' },
    })
  }
}

function buildDriverDetail(driver) {
  const trips = getDb()
    .trips.filter((item) => item.driverId === driver.id)
    .map((trip) => ({ ...trip }))
    .sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || '')),
    )

  return {
    ...driver,
    tripCount: trips.length,
    trips,
  }
}

export const driverMockRepository = {
  async list(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = [...getDb().drivers]

    if (query.status) {
      items = items.filter((item) => item.status === query.status)
    }

    if (query.licenseCategory) {
      items = items.filter(
        (item) => item.licenseCategory === query.licenseCategory,
      )
    }

    if (query.licenseCondition) {
      items = items.filter(
        (item) =>
          getLicenseCondition(item.licenseExpiryDate) === query.licenseCondition,
      )
    }

    items = applySearch(items, query, [
      'name',
      'licenseNumber',
      'contactNumber',
    ])
    items = applySort(items, query, 'name')
    return paginateItems(items, query)
  },

  async getById(id) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    return singleResponse(buildDriverDetail(findDriverOrThrow(id)))
  },

  async getAvailable(query = {}) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    let items = getDb().drivers.filter(
      (item) =>
        item.status === DRIVER_STATUS.AVAILABLE &&
        !isLicenseExpired(item.licenseExpiryDate),
    )

    if (query.licenseCategory) {
      items = items.filter(
        (item) => item.licenseCategory === query.licenseCategory,
      )
    }

    items = applySearch(items, query, [
      'name',
      'licenseNumber',
      'contactNumber',
    ])
    items = applySort(items, query, 'name')

    return paginateItems(items, {
      ...query,
      pageSize: query.pageSize || items.length || 10,
    })
  },

  async create(payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const licenseNumber = normalizeCode(payload.licenseNumber)
    assertManualStatus(payload.status)

    if (db.drivers.some((item) => item.licenseNumber === licenseNumber)) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_LICENSE',
        message: 'Licence number already exists',
        fieldErrors: { licenseNumber: 'Licence number already exists' },
      })
    }

    if (
      payload.status === DRIVER_STATUS.AVAILABLE &&
      isLicenseExpired(payload.licenseExpiryDate)
    ) {
      throw new ApiError({
        status: 400,
        code: 'LICENSE_EXPIRED',
        message: 'Expired driver cannot become AVAILABLE',
        fieldErrors: {
          status: 'Expired driver cannot become AVAILABLE',
        },
      })
    }

    const now = new Date().toISOString()
    const driver = {
      id: createId('drv'),
      name: String(payload.name || '').trim(),
      licenseNumber,
      licenseCategory: payload.licenseCategory,
      licenseExpiryDate: payload.licenseExpiryDate,
      contactNumber: String(payload.contactNumber || '').trim(),
      safetyScore: Number(payload.safetyScore ?? 0),
      status: payload.status || DRIVER_STATUS.AVAILABLE,
      createdAt: now,
      updatedAt: now,
    }

    db.drivers.unshift(driver)
    return singleResponse(driver)
  },

  async update(id, payload) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const db = getDb()
    const driver = findDriverOrThrow(id)
    const licenseNumber = normalizeCode(
      payload.licenseNumber ?? driver.licenseNumber,
    )
    const nextStatus = payload.status ?? driver.status
    assertManualStatus(payload.status)

    if (
      db.drivers.some(
        (item) => item.id !== id && item.licenseNumber === licenseNumber,
      )
    ) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_LICENSE',
        message: 'Licence number already exists',
        fieldErrors: { licenseNumber: 'Licence number already exists' },
      })
    }

    const expiry = payload.licenseExpiryDate ?? driver.licenseExpiryDate
    if (
      nextStatus === DRIVER_STATUS.AVAILABLE &&
      isLicenseExpired(expiry)
    ) {
      throw new ApiError({
        status: 400,
        code: 'LICENSE_EXPIRED',
        message: 'Expired driver cannot become AVAILABLE',
        fieldErrors: {
          status: 'Expired driver cannot become AVAILABLE',
        },
      })
    }

    Object.assign(driver, {
      name: String(payload.name ?? driver.name).trim(),
      licenseNumber,
      licenseCategory: payload.licenseCategory ?? driver.licenseCategory,
      licenseExpiryDate: expiry,
      contactNumber: String(
        payload.contactNumber ?? driver.contactNumber,
      ).trim(),
      safetyScore: Number(payload.safetyScore ?? driver.safetyScore),
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    })

    return singleResponse({ ...driver })
  },

  async changeStatus(id, status) {
    await mockDelay()
    authMockRepository.requireSessionUser()
    const driver = findDriverOrThrow(id)
    assertManualStatus(status)

    if (
      status === DRIVER_STATUS.SUSPENDED &&
      driver.status === DRIVER_STATUS.ON_TRIP
    ) {
      throw new ApiError({
        status: 409,
        code: 'DRIVER_ON_TRIP',
        message: 'ON_TRIP driver cannot be suspended',
      })
    }

    if (
      status === DRIVER_STATUS.AVAILABLE &&
      isLicenseExpired(driver.licenseExpiryDate)
    ) {
      throw new ApiError({
        status: 400,
        code: 'LICENSE_EXPIRED',
        message: 'Expired driver cannot become AVAILABLE',
      })
    }

    driver.status = status
    driver.updatedAt = new Date().toISOString()
    return singleResponse({ ...driver })
  },

  async suspend(id) {
    return this.changeStatus(id, DRIVER_STATUS.SUSPENDED)
  },
}
