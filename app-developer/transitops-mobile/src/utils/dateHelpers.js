import {
  addDays,
  format,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { DATE_FORMAT, DATETIME_FORMAT } from '../constants/appConstants'

export function parseDateValue(value) {
  if (!value) return null

  if (value instanceof Date) {
    return isValid(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = parseISO(value)
    if (isValid(parsed)) return parsed

    const fallback = new Date(value)
    return isValid(fallback) ? fallback : null
  }

  return null
}

export function formatDateSafe(value, pattern = DATE_FORMAT) {
  const date = parseDateValue(value)
  if (!date) return '—'
  return format(date, pattern)
}

export function formatDateTimeSafe(value, pattern = DATETIME_FORMAT) {
  return formatDateSafe(value, pattern)
}

export function isLicenseExpired(expiryDate, referenceDate = new Date()) {
  const expiry = parseDateValue(expiryDate)
  if (!expiry) return false
  return isBefore(startOfDay(expiry), startOfDay(referenceDate))
}

export function isLicenseExpiringSoon(
  expiryDate,
  days = 30,
  referenceDate = new Date(),
) {
  const expiry = parseDateValue(expiryDate)
  if (!expiry) return false
  if (isLicenseExpired(expiry, referenceDate)) return false

  const threshold = addDays(startOfDay(referenceDate), days)
  return (
    isBefore(startOfDay(expiry), threshold) ||
    startOfDay(expiry).getTime() === threshold.getTime()
  )
}

export function compareDates(left, right) {
  const leftDate = parseDateValue(left)
  const rightDate = parseDateValue(right)
  if (!leftDate || !rightDate) return 0
  return leftDate.getTime() - rightDate.getTime()
}

export function toApiDate(value) {
  const date = parseDateValue(value)
  if (!date) return null
  return format(date, 'yyyy-MM-dd')
}
