import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'
import { TRIP_STATUS } from '../../constants/statuses'

export default function DispatchTripDialog({
  open,
  trip,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const canDispatch = trip?.status === TRIP_STATUS.DRAFT

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Dispatch trip"
      message={
        <div className="space-y-3">
          <p>
            {trip ? (
              <>
                Dispatch <strong>{trip.tripNumber || trip.id}</strong> (
                {trip.source} → {trip.destination})?
              </>
            ) : (
              'Dispatch this trip?'
            )}
          </p>
          <p>
            The selected vehicle and driver will be marked ON_TRIP and removed
            from available dispatch lists for other users.
          </p>
          {!canDispatch ? (
            <InlineAlert tone="warning" title="Unavailable">
              Only draft trips can be dispatched.
            </InlineAlert>
          ) : null}
          {errorMessage ? (
            <InlineAlert tone="error" title="Unable to dispatch">
              {errorMessage}
            </InlineAlert>
          ) : null}
        </div>
      }
      confirmLabel={canDispatch ? 'Dispatch trip' : 'Cannot dispatch'}
      cancelLabel="Cancel"
      variant="primary"
      loading={loading}
      confirmDisabled={!canDispatch}
    />
  )
}
