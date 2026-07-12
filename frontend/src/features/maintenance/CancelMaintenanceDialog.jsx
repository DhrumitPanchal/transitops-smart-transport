import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import TextAreaField from '../../components/forms/TextAreaField'
import InlineAlert from '../../components/feedback/InlineAlert'
import { maintenanceCancellationSchema } from '../../validations/maintenanceValidation'
import { MAINTENANCE_STATUS } from '../../constants/statuses'
import { applyApiFieldErrors, getMaintenanceErrorMessage } from './maintenanceErrors'

export default function CancelMaintenanceDialog({
  open,
  maintenance,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const canCancel = maintenance?.status === MAINTENANCE_STATUS.SCHEDULED
  const dialogKey = `${maintenance?.id || 'none'}-${open ? 'open' : 'closed'}`

  return (
    <Modal open={open} onClose={onClose} title="Cancel maintenance" size="sm">
      <CancelMaintenanceForm
        key={dialogKey}
        maintenance={maintenance}
        canCancel={canCancel}
        loading={loading}
        errorMessage={errorMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}

function CancelMaintenanceForm({
  maintenance,
  canCancel,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maintenanceCancellationSchema),
    defaultValues: { reason: '' },
  })
  const [formError, setFormError] = useState(null)

  const onSubmit = handleSubmit(async (values) => {
    if (!canCancel || loading) return
    clearErrors('root')
    setFormError(null)

    try {
      await onConfirm?.(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setFormError(getMaintenanceErrorMessage(error))
    }
  })

  const vehicleLabel =
    maintenance?.vehicleRegistration ||
    maintenance?.vehicle?.registrationNumber ||
    maintenance?.vehicleId

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-slate-600">
        {maintenance ? (
          <>
            Cancel maintenance for <strong>{vehicleLabel}</strong>? The record
            is kept and the vehicle returns to AVAILABLE when appropriate.
          </>
        ) : (
          'Cancel this maintenance record?'
        )}
      </p>

      {!canCancel ? (
        <InlineAlert tone="warning" title="Unavailable">
          Only open or in-progress maintenance can be cancelled.
        </InlineAlert>
      ) : (
        <TextAreaField
          name="reason"
          label="Cancellation reason"
          required
          disabled={loading}
          registration={register('reason')}
          error={errors.reason?.message}
        />
      )}

      {errorMessage || formError ? (
        <InlineAlert tone="error" title="Unable to cancel">
          {errorMessage || formError}
        </InlineAlert>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Keep record
        </Button>
        <Button
          type="submit"
          variant="danger"
          loading={loading}
          disabled={loading || !canCancel}
        >
          Cancel maintenance
        </Button>
      </div>
    </form>
  )
}
