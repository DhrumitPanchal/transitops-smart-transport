export class ApiError extends Error {
  constructor({
    message = 'An unexpected error occurred',
    status = 500,
    code = 'INTERNAL_ERROR',
    fieldErrors = null,
  } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      fieldErrors: this.fieldErrors,
    }
  }
}

export function createApiError({
  message,
  status = 500,
  code = 'INTERNAL_ERROR',
  fieldErrors = null,
} = {}) {
  return new ApiError({ message, status, code, fieldErrors })
}

export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function getFieldErrors(error) {
  if (error instanceof ApiError) {
    return error.fieldErrors || null
  }

  return error?.response?.data?.fieldErrors || error?.fieldErrors || null
}
