import { DRIVER_STATUS } from '../../constants/statuses'
import {
  isLicenseExpired,
  isLicenseExpiringSoon,
} from '../../utils/dateHelpers'

export const LICENSE_CONDITIONS = {
  VALID: 'VALID',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
}

export const LICENSE_CONDITION_LABELS = {
  [LICENSE_CONDITIONS.VALID]: 'Valid',
  [LICENSE_CONDITIONS.EXPIRING_SOON]: 'Expiring soon',
  [LICENSE_CONDITIONS.EXPIRED]: 'Expired',
}

export const LICENSE_CONDITION_OPTIONS = Object.values(LICENSE_CONDITIONS).map(
  (value) => ({
    value,
    label: LICENSE_CONDITION_LABELS[value],
  }),
)

export const LICENSE_EXPIRING_SOON_DAYS = 30

export function getLicenseCondition(expiryDate) {
  if (isLicenseExpired(expiryDate)) {
    return LICENSE_CONDITIONS.EXPIRED
  }

  if (isLicenseExpiringSoon(expiryDate, LICENSE_EXPIRING_SOON_DAYS)) {
    return LICENSE_CONDITIONS.EXPIRING_SOON
  }

  return LICENSE_CONDITIONS.VALID
}

export function doesDriverMatchFilters(driver, filters = {}) {
  if (!driver) return false

  const search = String(filters.search || '')
    .trim()
    .toLowerCase()

  if (search) {
    const haystack = [driver.name, driver.licenseNumber, driver.contactNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.status && driver.status !== filters.status) {
    return false
  }

  if (
    filters.licenseCategory &&
    driver.licenseCategory !== filters.licenseCategory
  ) {
    return false
  }

  if (filters.licenseCondition) {
    const condition = getLicenseCondition(driver.licenseExpiryDate)
    if (condition !== filters.licenseCondition) {
      return false
    }
  }

  return true
}

export function isDriverDispatchAvailable(driver) {
  if (!driver) return false
  return (
    driver.status === DRIVER_STATUS.AVAILABLE &&
    !isLicenseExpired(driver.licenseExpiryDate)
  )
}
