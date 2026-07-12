import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import TextAreaField from '../../components/forms/TextAreaField'
import InlineAlert from '../../components/feedback/InlineAlert'
import { tripCancellationSchema } from '../../validations/tripValidation'
import { TRIP_STATUS } from '../../constants/statuses'
import { applyApiFieldErrors, getTripErrorMessage } from './tripErrors'

export default function CancelTripDialog({
  open,
  trip,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const canCancel =
    trip?.status === TRIP_STATUS.DRAFT ||
    trip?.status === TRIP_STATUS.DISPATCHED
  const dialogKey = `${trip?.id || 'none'}-${open ? 'open' : 'closed'}`

  return (
    <Modal open={open} onClose={onClose} title="Cancel trip" size="sm">
      <CancelTripForm
        key={dialogKey}
        trip={trip}
        canCancel={canCancel}
        loading={loading}
        errorMessage={errorMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}

function CancelTripForm({
  trip,
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
    resolver: zodResolver(tripCancellationSchema),
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
      setFormError(getTripErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-slate-600">
        {trip ? (
          <>
            Cancel <strong>{trip.tripNumber || trip.id}</strong>?
            {trip.status === TRIP_STATUS.DISPATCHED
              ? ' The vehicle and driver will return to AVAILABLE.'
              : ''}
          </>
        ) : (
          'Cancel this trip?'
        )}
      </p>

      {!canCancel ? (
        <InlineAlert tone="warning" title="Unavailable">
          Only draft or dispatched trips can be cancelled.
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
          Keep trip
        </Button>
        <Button
          type="submit"
          variant="danger"
          loading={loading}
          disabled={loading || !canCancel}
        >
          Cancel trip
        </Button>
      </div>
    </form>
  )
}
