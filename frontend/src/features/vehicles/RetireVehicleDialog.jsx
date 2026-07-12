import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'
import { VEHICLE_STATUS } from '../../constants/statuses'

export default function RetireVehicleDialog({
  open,
  vehicle,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const isOnTrip = vehicle?.status === VEHICLE_STATUS.ON_TRIP
  const isRetired = vehicle?.status === VEHICLE_STATUS.RETIRED
  const blocked = isOnTrip || isRetired

  let message =
    'Retiring this vehicle keeps the record for history, but retired vehicles cannot be dispatched on new trips.'

  if (isOnTrip) {
    message =
      'This vehicle is currently ON_TRIP and cannot be retired until the trip is completed or cancelled.'
  } else if (isRetired) {
    message = 'This vehicle is already retired.'
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Retire vehicle"
      message={
        <div className="space-y-3">
          <p>
            {vehicle ? (
              <>
                Retire <strong>{vehicle.registrationNumber}</strong>
                {vehicle.vehicleName ? ` (${vehicle.vehicleName})` : ''}?
              </>
            ) : (
              'Retire this vehicle?'
            )}
          </p>
          <p>{message}</p>
          {errorMessage ? (
            <InlineAlert tone="error" title="Unable to retire">
              {errorMessage}
            </InlineAlert>
          ) : null}
        </div>
      }
      confirmLabel={blocked ? 'Cannot retire' : 'Retire vehicle'}
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
      confirmDisabled={blocked}
    />
  )
}
