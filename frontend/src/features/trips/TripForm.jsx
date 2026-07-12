import { useEffect, useMemo } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  tripSchema,
  validateTripResources,
} from '../../validations/tripValidation'
import { VALIDATION_MESSAGES } from '../../constants/validationMessages'
import TextField from '../../components/forms/TextField'
import NumberField from '../../components/forms/NumberField'
import CurrencyField from '../../components/forms/CurrencyField'
import SearchableSelectField from '../../components/forms/SearchableSelectField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import { useAvailableVehicles } from '../../hooks/vehicles'
import { useAvailableDrivers } from '../../hooks/drivers'
import { formatDate, formatWeight } from '../../utils/formatters'
import { LICENCE_CATEGORY_LABELS } from '../../constants/appConstants'
import { DEFAULT_TRIP_FORM_VALUES } from './tripFormDefaults'
import { applyApiFieldErrors, getTripErrorMessage } from './tripErrors'

export default function TripForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save trip',
  isSubmitting = false,
  serverError = null,
}) {
  const vehiclesQuery = useAvailableVehicles()
  const driversQuery = useAvailableDrivers()

  const vehicles = useMemo(
    () => vehiclesQuery.data?.data || [],
    [vehiclesQuery.data?.data],
  )
  const drivers = useMemo(
    () => driversQuery.data?.data || [],
    [driversQuery.data?.data],
  )

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      ...DEFAULT_TRIP_FORM_VALUES,
      ...defaultValues,
    },
  })

  const vehicleId = useWatch({ control, name: 'vehicleId' })
  const driverId = useWatch({ control, name: 'driverId' })
  const cargoWeight = useWatch({ control, name: 'cargoWeight' })

  useEffect(() => {
    if (!vehicleId) return
    if (vehiclesQuery.isLoading || vehiclesQuery.isFetching) return
    if (vehicles.some((item) => item.id === vehicleId)) return
    setValue('vehicleId', '', { shouldValidate: true, shouldDirty: true })
  }, [
    vehicleId,
    vehicles,
    vehiclesQuery.isFetching,
    vehiclesQuery.isLoading,
    setValue,
  ])

  useEffect(() => {
    if (!driverId) return
    if (driversQuery.isLoading || driversQuery.isFetching) return
    if (drivers.some((item) => item.id === driverId)) return
    setValue('driverId', '', { shouldValidate: true, shouldDirty: true })
  }, [
    driverId,
    drivers,
    driversQuery.isFetching,
    driversQuery.isLoading,
    setValue,
  ])

  const selectedVehicle = useMemo(
    () => vehicles.find((item) => item.id === vehicleId) || null,
    [vehicles, vehicleId],
  )
  const selectedDriver = useMemo(
    () => drivers.find((item) => item.id === driverId) || null,
    [drivers, driverId],
  )

  const capacityError =
    selectedVehicle &&
    cargoWeight !== '' &&
    cargoWeight != null &&
    Number(cargoWeight) > Number(selectedVehicle.maxLoadCapacity)
      ? VALIDATION_MESSAGES.CARGO_EXCEEDS_CAPACITY
      : null

  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.registrationNumber} · ${vehicle.vehicleName} · Cap ${formatWeight(vehicle.maxLoadCapacity, 'kg')}`,
  }))

  const driverOptions = drivers.map((driver) => ({
    value: driver.id,
    label: `${driver.name} · ${LICENCE_CATEGORY_LABELS[driver.licenseCategory] || driver.licenseCategory} · Exp ${formatDate(driver.licenseExpiryDate)}`,
  }))

  const busy = isSubmitting

  const handleFormSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')

    const resourceCheck = validateTripResources(
      values,
      selectedVehicle,
      selectedDriver,
    )

    if (!resourceCheck.success) {
      Object.entries(resourceCheck.errors).forEach(([field, message]) => {
        setError(field, { type: 'validate', message })
      })
      return
    }

    try {
      await onSubmit(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getTripErrorMessage(error),
      })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save trip">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Route"
        description="Source and destination for this trip."
      >
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <TextField
            name="source"
            label="Source"
            required
            disabled={busy}
            registration={register('source')}
            error={errors.source?.message}
          />
          <TextField
            name="destination"
            label="Destination"
            required
            disabled={busy}
            registration={register('destination')}
            error={errors.destination?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title="Resources"
        description="Only available vehicles and drivers with valid licences are listed."
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
              helperText={
                selectedVehicle
                  ? `Capacity ${formatWeight(selectedVehicle.maxLoadCapacity, 'kg')}`
                  : 'Select an AVAILABLE vehicle'
              }
            />
          )}
        />

        <Controller
          name="driverId"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              name="driverId"
              label="Driver"
              required
              disabled={busy || driversQuery.isLoading}
              options={driverOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.driverId?.message}
              helperText="Only AVAILABLE drivers with non-expired licences"
            />
          )}
        />
      </FormSection>

      <FormSection
        title="Load and distance"
        description="Cargo must not exceed the selected vehicle capacity."
      >
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <NumberField
            name="cargoWeight"
            label="Cargo weight (kg)"
            required
            disabled={busy}
            registration={register('cargoWeight')}
            error={errors.cargoWeight?.message || capacityError}
          />
          <NumberField
            name="plannedDistance"
            label="Planned distance (km)"
            required
            disabled={busy}
            registration={register('plannedDistance')}
            error={errors.plannedDistance?.message}
          />
          <CurrencyField
            name="revenue"
            label="Estimated revenue"
            disabled={busy}
            registration={register('revenue')}
            error={errors.revenue?.message}
          />
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        loading={busy}
        disabled={busy || Boolean(capacityError)}
      />
    </form>
  )
}
