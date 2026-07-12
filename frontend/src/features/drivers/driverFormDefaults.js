import { STATUS_LABELS } from '../../constants/statuses'
import { DRIVER_FORM_STATUSES } from '../../constants/formOptions'
import { DRIVER_STATUS } from '../../constants/statuses'

export const DRIVER_FORM_STATUS_OPTIONS = DRIVER_FORM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

export const DRIVER_CHANGE_STATUS_OPTIONS = [
  DRIVER_STATUS.AVAILABLE,
  DRIVER_STATUS.OFF_DUTY,
].map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

export const DEFAULT_DRIVER_FORM_VALUES = {
  name: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiryDate: '',
  contactNumber: '',
  safetyScore: 80,
  status: DRIVER_STATUS.AVAILABLE,
}
