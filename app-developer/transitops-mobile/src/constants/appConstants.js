export const APP_NAME = 'TransitOps'
export const APP_VERSION = '1.0.0'

export const CURRENCY_CODE = 'INR'
export const CURRENCY_SYMBOL = '₹'

export const PAGE_SIZES = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 10

export const DATE_FORMAT = 'dd MMM yyyy'
export const DATETIME_FORMAT = 'dd MMM yyyy, HH:mm'
export const DATE_INPUT_FORMAT = 'yyyy-MM-dd'
export const API_DATE_FORMAT = 'yyyy-MM-dd'

export const VEHICLE_TYPES = {
  BUS: 'BUS',
  MINIBUS: 'MINIBUS',
  VAN: 'VAN',
  TRUCK: 'TRUCK',
  CAR: 'CAR',
}

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.BUS]: 'Bus',
  [VEHICLE_TYPES.MINIBUS]: 'Minibus',
  [VEHICLE_TYPES.VAN]: 'Van',
  [VEHICLE_TYPES.TRUCK]: 'Truck',
  [VEHICLE_TYPES.CAR]: 'Car',
}

export const VEHICLE_TYPE_OPTIONS = Object.values(VEHICLE_TYPES).map(
  (value) => ({
    value,
    label: VEHICLE_TYPE_LABELS[value],
  }),
)

export const LICENCE_CATEGORIES = {
  LMV: 'LMV',
  HMV: 'HMV',
  HPMV: 'HPMV',
  HTV: 'HTV',
  PSV: 'PSV',
}

export const LICENCE_CATEGORY_LABELS = {
  [LICENCE_CATEGORIES.LMV]: 'Light Motor Vehicle (LMV)',
  [LICENCE_CATEGORIES.HMV]: 'Heavy Motor Vehicle (HMV)',
  [LICENCE_CATEGORIES.HPMV]: 'Heavy Passenger Motor Vehicle (HPMV)',
  [LICENCE_CATEGORIES.HTV]: 'Heavy Transport Vehicle (HTV)',
  [LICENCE_CATEGORIES.PSV]: 'Public Service Vehicle (PSV)',
}

export const LICENCE_CATEGORY_OPTIONS = Object.values(LICENCE_CATEGORIES).map(
  (value) => ({
    value,
    label: LICENCE_CATEGORY_LABELS[value],
  }),
)

export const MAINTENANCE_TYPES = {
  ROUTINE: 'ROUTINE',
  PREVENTIVE: 'PREVENTIVE',
  CORRECTIVE: 'CORRECTIVE',
  INSPECTION: 'INSPECTION',
  TYRE: 'TYRE',
  BATTERY: 'BATTERY',
  BODYWORK: 'BODYWORK',
  OTHER: 'OTHER',
}

export const MAINTENANCE_TYPE_LABELS = {
  [MAINTENANCE_TYPES.ROUTINE]: 'Routine Service',
  [MAINTENANCE_TYPES.PREVENTIVE]: 'Preventive',
  [MAINTENANCE_TYPES.CORRECTIVE]: 'Corrective',
  [MAINTENANCE_TYPES.INSPECTION]: 'Inspection',
  [MAINTENANCE_TYPES.TYRE]: 'Tyre',
  [MAINTENANCE_TYPES.BATTERY]: 'Battery',
  [MAINTENANCE_TYPES.BODYWORK]: 'Bodywork',
  [MAINTENANCE_TYPES.OTHER]: 'Other',
}

export const MAINTENANCE_TYPE_OPTIONS = Object.values(MAINTENANCE_TYPES).map(
  (value) => ({
    value,
    label: MAINTENANCE_TYPE_LABELS[value],
  }),
)

export const EXPENSE_TYPES = {
  TOLL: 'TOLL',
  PARKING: 'PARKING',
  FINE: 'FINE',
  REPAIR: 'REPAIR',
  INSURANCE: 'INSURANCE',
  PERMIT: 'PERMIT',
  MISCELLANEOUS: 'MISCELLANEOUS',
}

export const EXPENSE_TYPE_LABELS = {
  [EXPENSE_TYPES.TOLL]: 'Toll',
  [EXPENSE_TYPES.PARKING]: 'Parking',
  [EXPENSE_TYPES.FINE]: 'Fine',
  [EXPENSE_TYPES.REPAIR]: 'Repair',
  [EXPENSE_TYPES.INSURANCE]: 'Insurance',
  [EXPENSE_TYPES.PERMIT]: 'Permit',
  [EXPENSE_TYPES.MISCELLANEOUS]: 'Miscellaneous',
}

export const EXPENSE_TYPE_OPTIONS = Object.values(EXPENSE_TYPES).map(
  (value) => ({
    value,
    label: EXPENSE_TYPE_LABELS[value],
  }),
)
