import { getErrorMessage, getFieldErrors } from '../../api/apiError'

export function applyApiFieldErrors(setError, error) {
  const fieldErrors = getFieldErrors(error)
  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return false
  }

  let applied = false
  Object.entries(fieldErrors).forEach(([field, message]) => {
    if (!field) return
    setError(field, {
      type: 'server',
      message: Array.isArray(message) ? message[0] : String(message),
    })
    applied = true
  })

  return applied
}

export function getFuelLogErrorMessage(
  error,
  fallback = 'Something went wrong. Please try again.',
) {
  const status = error?.status

  if (status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.'
  }

  if (status === 404) {
    return 'Fuel log not found.'
  }

  if (status === 409) {
    return getErrorMessage(error) || 'This action conflicts with the current state.'
  }

  if (status === 400 || status === 422) {
    return (
      getErrorMessage(error) ||
      'Please correct the highlighted fields and try again.'
    )
  }

  if (status >= 500) {
    return 'A server error occurred. Please try again later.'
  }

  return getErrorMessage(error) || fallback
}
