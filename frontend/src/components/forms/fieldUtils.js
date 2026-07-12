import { cn } from '../../utils/helpers'

const INPUT_CLASSES =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 read-only:bg-slate-50'

export function getFieldIds(name, id) {
  const fieldId = id || name
  return {
    fieldId,
    errorId: `${fieldId}-error`,
    helperId: `${fieldId}-helper`,
  }
}

export function buildDescribedBy({ error, helperText, errorId, helperId }) {
  const ids = []
  if (error) ids.push(errorId)
  if (helperText) ids.push(helperId)
  return ids.length ? ids.join(' ') : undefined
}

export function inputClassName(error, className) {
  return cn(
    INPUT_CLASSES,
    error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
    className,
  )
}
