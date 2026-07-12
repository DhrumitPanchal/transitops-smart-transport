import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'
import { DRIVER_STATUS } from '../../constants/statuses'

export default function SuspendDriverDialog({
  open,
  driver,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const isOnTrip = driver?.status === DRIVER_STATUS.ON_TRIP
  const isSuspended = driver?.status === DRIVER_STATUS.SUSPENDED
  const blocked = isOnTrip || isSuspended

  let message =
    'Suspended drivers cannot be dispatched until their status is restored.'

  if (isOnTrip) {
    message =
      'This driver is currently ON_TRIP and cannot be suspended until the trip is completed or cancelled.'
  } else if (isSuspended) {
    message = 'This driver is already suspended.'
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Suspend driver"
      message={
        <div className="space-y-3">
          <p>
            {driver ? (
              <>
                Suspend <strong>{driver.name}</strong> ({driver.licenseNumber})?
              </>
            ) : (
              'Suspend this driver?'
            )}
          </p>
          <p>{message}</p>
          {errorMessage ? (
            <InlineAlert tone="error" title="Unable to suspend">
              {errorMessage}
            </InlineAlert>
          ) : null}
        </div>
      }
      confirmLabel={blocked ? 'Cannot suspend' : 'Suspend driver'}
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
      confirmDisabled={blocked}
    />
  )
}
