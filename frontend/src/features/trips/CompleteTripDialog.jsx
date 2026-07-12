import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import NumberField from '../../components/forms/NumberField'
import CurrencyField from '../../components/forms/CurrencyField'
import InlineAlert from '../../components/feedback/InlineAlert'
import { createTripCompletionSchema } from '../../validations/tripValidation'
import { TRIP_STATUS } from '../../constants/statuses'
import { applyApiFieldErrors, getTripErrorMessage } from './tripErrors'

export default function CompleteTripDialog({
  open,
  trip,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const canComplete = trip?.status === TRIP_STATUS.DISPATCHED
  const dialogKey = `${trip?.id || 'none'}-${open ? 'open' : 'closed'}`

  return (
    <Modal open={open} onClose={onClose} title="Complete trip" size="md">
      <CompleteTripForm
        key={dialogKey}
        trip={trip}
        canComplete={canComplete}
        loading={loading}
        errorMessage={errorMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}

function CompleteTripForm({
  trip,
  canComplete,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}) {
  const schema = useMemo(
    () => createTripCompletionSchema(trip?.startOdometer),
    [trip?.startOdometer],
  )

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      finalOdometer: '',
      fuelConsumed: '',
      fuelCost: '',
      revenue: trip?.revenue ?? '',
    },
  })

  const [formError, setFormError] = useState(null)

  const onSubmit = handleSubmit(async (values) => {
    if (!canComplete || loading) return
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
            Complete <strong>{trip.tripNumber || trip.id}</strong>. The vehicle
            and driver will return to AVAILABLE when successful.
          </>
        ) : (
          'Complete this trip.'
        )}
      </p>

      {!canComplete ? (
        <InlineAlert tone="warning" title="Unavailable">
          Only dispatched trips can be completed.
        </InlineAlert>
      ) : (
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <NumberField
            name="finalOdometer"
            label="Final odometer (km)"
            required
            disabled={loading}
            helperText={`Start odometer: ${trip?.startOdometer ?? '—'}`}
            registration={register('finalOdometer')}
            error={errors.finalOdometer?.message}
          />
          <NumberField
            name="fuelConsumed"
            label="Fuel consumed (L)"
            required
            disabled={loading}
            registration={register('fuelConsumed')}
            error={errors.fuelConsumed?.message}
          />
          <CurrencyField
            name="fuelCost"
            label="Fuel cost"
            required
            disabled={loading}
            registration={register('fuelCost')}
            error={errors.fuelCost?.message}
          />
          <CurrencyField
            name="revenue"
            label="Revenue"
            disabled={loading}
            registration={register('revenue')}
            error={errors.revenue?.message}
          />
        </div>
      )}

      {errorMessage || formError ? (
        <InlineAlert tone="error" title="Unable to complete">
          {errorMessage || formError}
        </InlineAlert>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading || !canComplete}
        >
          Complete trip
        </Button>
      </div>
    </form>
  )
}
