import {
  CURRENCY_CODE,
  DATE_FORMAT,
  DATETIME_FORMAT,
} from '../constants/appConstants'
import { STATUS_LABELS } from '../constants/statuses'
import { formatDateSafe, formatDateTimeSafe } from './dateHelpers'

function toFiniteNumber(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function formatDate(value, pattern = DATE_FORMAT) {
  return formatDateSafe(value, pattern)
}

export function formatDateTime(value, pattern = DATETIME_FORMAT) {
  return formatDateTimeSafe(value, pattern)
}

export function formatCurrency(amount, currency = CURRENCY_CODE) {
  const number = toFiniteNumber(amount)
  if (number == null) return '—'

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(number)
  } catch {
    return `₹${number.toFixed(2)}`
  }
}

export function formatNumber(value, options = {}) {
  const number = toFiniteNumber(value)
  if (number == null) return '—'

  try {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      ...options,
    }).format(number)
  } catch {
    return String(number)
  }
}

export function formatDistance(value, unit = 'km') {
  const number = toFiniteNumber(value)
  if (number == null) return '—'
  return `${formatNumber(number)} ${unit}`
}

export function formatWeight(value, unit = 'kg') {
  const number = toFiniteNumber(value)
  if (number == null) return '—'
  return `${formatNumber(number)} ${unit}`
}

export function formatFuel(value, unit = 'L') {
  const number = toFiniteNumber(value)
  if (number == null) return '—'
  return `${formatNumber(number)} ${unit}`
}

export function formatPercentage(value, digits = 1) {
  const number = toFiniteNumber(value)
  if (number == null) return '—'
  return `${number.toFixed(digits)}%`
}

export function humanizeEnum(value = '') {
  if (value == null || value === '') return '—'
  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function capitalize(value = '') {
  return humanizeEnum(value)
}

export function formatStatusLabel(status) {
  if (!status) return '—'
  return STATUS_LABELS[status] || humanizeEnum(status)
}
