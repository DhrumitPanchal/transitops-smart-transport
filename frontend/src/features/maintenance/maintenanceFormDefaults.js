import { STATUS_LABELS, MAINTENANCE_STATUS } from '../../constants/statuses'
import { MAINTENANCE_CREATE_STATUSES } from '../../constants/formOptions'

export const MAINTENANCE_CREATE_STATUS_OPTIONS = MAINTENANCE_CREATE_STATUSES.map(
  (value) => ({
    value,
    label: STATUS_LABELS[value] || value,
  }),
)

export const DEFAULT_MAINTENANCE_FORM_VALUES = {
  vehicleId: '',
  maintenanceType: '',
  description: '',
  startDate: '',
  expectedEndDate: '',
  cost: '',
  vendorName: '',
  notes: '',
  status: MAINTENANCE_STATUS.OPEN,
}
