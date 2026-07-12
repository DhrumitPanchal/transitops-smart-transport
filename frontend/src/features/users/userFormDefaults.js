import { USER_STATUS } from '../../constants/statuses'

export const DEFAULT_USER_CREATE_VALUES = {
  name: '',
  email: '',
  role: '',
  status: USER_STATUS.ACTIVE,
  password: '',
  confirmPassword: '',
}

export const DEFAULT_USER_EDIT_VALUES = {
  name: '',
  email: '',
  role: '',
  status: USER_STATUS.ACTIVE,
}

export function normalizeUserCreatePayload(values = {}) {
  return {
    name: String(values.name || '').trim(),
    email: String(values.email || '')
      .trim()
      .toLowerCase(),
    role: values.role,
    status: values.status,
    password: values.password,
  }
}

export function normalizeUserUpdatePayload(values = {}) {
  return {
    name: values.name,
    email: values.email,
    role: values.role,
    status: values.status,
  }
}
