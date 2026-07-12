import { format, parseISO, isValid } from 'date-fns'
import {
  CURRENCY_CODE,
  DATE_FORMAT,
  DATETIME_FORMAT,
} from '../constants/appConstants'

export function formatDate(value, pattern = DATE_FORMAT) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) return '—'
  return format(date, pattern)
}

export function formatDateTime(value) {
  return formatDate(value, DATETIME_FORMAT)
}

export function formatCurrency(amount, currency = CURRENCY_CODE) {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}

export function capitalize(value = '') {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}
