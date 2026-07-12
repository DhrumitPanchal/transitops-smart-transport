import {
  CURRENCY_CODE,
  DATE_FORMAT,
  DATETIME_FORMAT,
} from '../constants/appConstants'
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

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(number)
}

export function formatNumber(value, options = {}) {
  const number = toFiniteNumber(value)
  if (number == null) return '—'

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    ...options,
  }).format(number)
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
