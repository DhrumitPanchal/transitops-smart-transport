import { getStatusLabel } from '../../utils/helpers'
import Badge from './Badge'

const STATUS_TONES = {
  AVAILABLE: 'green',
  ACTIVE: 'green',
  COMPLETED: 'green',
  ON_TRIP: 'blue',
  DISPATCHED: 'blue',
  IN_PROGRESS: 'blue',
  OPEN: 'amber',
  SCHEDULED: 'amber',
  DRAFT: 'slate',
  OFF_DUTY: 'slate',
  PENDING: 'amber',
  INACTIVE: 'slate',
  IN_SHOP: 'amber',
  SUSPENDED: 'red',
  RETIRED: 'slate',
  CANCELLED: 'red',
}

export default function StatusBadge({ status, className }) {
  return (
    <Badge tone={STATUS_TONES[status] || 'slate'} className={className}>
      {getStatusLabel(status)}
    </Badge>
  )
}
