import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'
import { formatDate } from '../../utils/formatters'

export default function DeleteFuelLogDialog({
  open,
  fuelLog,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const vehicleLabel =
    fuelLog?.vehicleRegistration ||
    fuelLog?.vehicle?.registrationNumber ||
    fuelLog?.vehicleId

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete fuel log"
      message={
        <div className="space-y-3">
          <p>
            {fuelLog ? (
              <>
                Delete the fuel log for <strong>{vehicleLabel}</strong> on{' '}
                <strong>{formatDate(fuelLog.fuelDate)}</strong>?
              </>
            ) : (
              'Delete this fuel log?'
            )}
          </p>
          <p>This permanently removes the record from the fuel log list.</p>
          {errorMessage ? (
            <InlineAlert tone="error" title="Unable to delete">
              {errorMessage}
            </InlineAlert>
          ) : null}
        </div>
      }
      confirmLabel="Delete fuel log"
      cancelLabel="Keep record"
      variant="danger"
      loading={loading}
    />
  )
}
