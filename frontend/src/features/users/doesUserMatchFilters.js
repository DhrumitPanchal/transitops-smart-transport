import { parseDateValue } from '../../utils/dateHelpers'

export function doesUserMatchFilters(record, filters = {}) {
  if (!record) return false

  const search = String(filters.search || '')
    .trim()
    .toLowerCase()

  if (search) {
    const haystack = [record.name, record.email, record.role, record.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }

  if (filters.status && record.status !== filters.status) {
    return false
  }

  if (filters.role && record.role !== filters.role) {
    return false
  }

  if (filters.dateFrom || filters.dateTo) {
    const created = parseDateValue(record.createdAt)
    if (!created) return false

    if (filters.dateFrom) {
      const from = parseDateValue(filters.dateFrom)
      if (from && created < from) return false
    }

    if (filters.dateTo) {
      const to = parseDateValue(filters.dateTo)
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (created > end) return false
      }
    }
  }

  return true
}
