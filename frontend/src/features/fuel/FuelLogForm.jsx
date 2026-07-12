import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fuelSchema } from '../../validations/fuelValidation'
import TextField from '../../components/forms/TextField'
import TextAreaField from '../../components/forms/TextAreaField'
import NumberField from '../../components/forms/NumberField'
import CurrencyField from '../../components/forms/CurrencyField'
import DateField from '../../components/forms/DateField'
import SearchableSelectField from '../../components/forms/SearchableSelectField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import { useVehicles } from '../../hooks/vehicles'
import { useTrips } from '../../hooks/trips'
import {
  DEFAULT_FUEL_LOG_FORM_VALUES,
  normalizeFuelLogPayload,
} from './fuelFormDefaults'
import { applyApiFieldErrors, getFuelLogErrorMessage } from './fuelErrors'

export default function FuelLogForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save fuel log',
  isSubmitting = false,
  serverError = null,
}) {
  const vehiclesQuery = useVehicles({
    pageSize: 100,
    sortBy: 'registrationNumber',
  })
  const tripsQuery = useTrips({ pageSize: 100, sortBy: 'createdAt' })

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      ...DEFAULT_FUEL_LOG_FORM_VALUES,
      ...defaultValues,
    },
  })

  const vehicleOptions = useMemo(
    () =>
      (vehiclesQuery.data?.data || []).map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      })),
    [vehiclesQuery.data?.data],
  )

  const tripOptions = useMemo(
    () => [
      { value: '', label: 'No trip' },
      ...(tripsQuery.data?.data || []).map((trip) => ({
        value: trip.id,
        label: `${trip.tripNumber || trip.id} · ${trip.source} → ${trip.destination}`,
      })),
    ],
    [tripsQuery.data?.data],
  )

  const busy = isSubmitting

  const handleFormSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')

    try {
      await onSubmit(normalizeFuelLogPayload(values))
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getFuelLogErrorMessage(error),
      })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save fuel log">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Vehicle and trip"
        description="Link the fill-up to a vehicle. Trip is optional."
      >
        <Controller
          name="vehicleId"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              name="vehicleId"
              label="Vehicle"
              required
              disabled={busy || vehiclesQuery.isLoading}
              options={vehicleOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.vehicleId?.message}
            />
          )}
        />
        <Controller
          name="tripId"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              name="tripId"
              label="Trip"
              disabled={busy || tripsQuery.isLoading}
              options={tripOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.tripId?.message}
              helperText="Optional — leave blank for depot or off-trip fueling."
            />
          )}
        />
      </FormSection>

      <FormSection title="Fuel details">
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <DateField
            name="fuelDate"
            label="Fuel date"
            required
            disabled={busy}
            registration={register('fuelDate')}
            error={errors.fuelDate?.message}
          />
          <NumberField
            name="odometerReading"
            label="Odometer reading"
            required
            disabled={busy}
            registration={register('odometerReading')}
            error={errors.odometerReading?.message}
          />
          <NumberField
            name="liters"
            label="Litres"
            required
            disabled={busy}
            registration={register('liters')}
            error={errors.liters?.message}
          />
          <CurrencyField
            name="cost"
            label="Cost"
            required
            disabled={busy}
            registration={register('cost')}
            error={errors.cost?.message}
          />
          <TextField
            name="stationName"
            label="Station"
            disabled={busy}
            registration={register('stationName')}
            error={errors.stationName?.message}
          />
        </div>
        <TextAreaField
          name="notes"
          label="Notes"
          disabled={busy}
          registration={register('notes')}
          error={errors.notes?.message}
        />
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        loading={busy}
        disabled={busy}
      />
    </form>
  )
}
