import { STATUS_LABELS } from '../../constants/statuses'
import { VEHICLE_FORM_STATUSES } from '../../constants/formOptions'

export const VEHICLE_FORM_STATUS_OPTIONS = VEHICLE_FORM_STATUSES.map(
  (value) => ({
    value,
    label: STATUS_LABELS[value] || value,
  }),
)

export const VEHICLE_REGION_OPTIONS = [
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Mysuru', label: 'Mysuru' },
  { value: 'Hubballi', label: 'Hubballi' },
  { value: 'Mangaluru', label: 'Mangaluru' },
  { value: 'Chennai', label: 'Chennai' },
]

export const DEFAULT_VEHICLE_FORM_VALUES = {
  registrationNumber: '',
  vehicleName: '',
  model: '',
  vehicleType: '',
  maxLoadCapacity: '',
  odometer: '',
  acquisitionCost: '',
  region: '',
  status: 'AVAILABLE',
}
