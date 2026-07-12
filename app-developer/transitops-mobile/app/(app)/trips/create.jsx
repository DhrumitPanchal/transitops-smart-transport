import React, { useEffect, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  TextField,
  NumberField,
  CurrencyField,
  SearchableSelectField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useCreateTrip } from '@/hooks/trips'
import { useAvailableVehicles } from '@/hooks/vehicles'
import { useAvailableDrivers } from '@/hooks/drivers'
import {
  tripSchema,
  validateTripResources,
} from '@/validations/tripValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { VALIDATION_MESSAGES } from '@/constants/validationMessages'
import { LICENCE_CATEGORY_LABELS } from '@/constants/appConstants'
import { buildPath } from '@/utils/helpers'
import { formatDate, formatWeight } from '@/utils/formatters'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const DEFAULT_VALUES = {
  source: '',
  destination: '',
  vehicleId: '',
  driverId: '',
  cargoWeight: '',
  plannedDistance: '',
  revenue: '',
}

export default function TripCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.TRIPS_CREATE,
  )
  const createMutation = useCreateTrip()
  const vehiclesQuery = useAvailableVehicles({}, { enabled: allowed })
  const driversQuery = useAvailableDrivers({}, { enabled: allowed })

  const vehicles = useMemo(
    () => vehiclesQuery.data?.data || [],
    [vehiclesQuery.data?.data],
  )
  const drivers = useMemo(
    () => driversQuery.data?.data || [],
    [driversQuery.data?.data],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: DEFAULT_VALUES,
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

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
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
      const response = await createMutation.mutateAsync(values)
      const trip = response?.data
      toast.success('Trip created as draft')
      router.replace(
        trip?.id ? buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }) : ROUTES.TRIPS,
      )
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, { notFound: 'Trip not found.' }),
      })
    }
  })

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Create trip"
        subtitle="Draft with available resources"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save trip"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection title="Route" description="Source and destination.">
        <Controller
          control={control}
          name="source"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Source"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.source?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="destination"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Destination"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.destination?.message}
            />
          )}
        />
      </FormSection>

      <FormSection
        title="Resources"
        description="Only AVAILABLE vehicles and drivers with valid licences."
      >
        <Controller
          control={control}
          name="vehicleId"
          render={({ field: { value, onChange } }) => (
            <SearchableSelectField
              label="Vehicle"
              required
              value={value}
              onChange={onChange}
              options={vehicleOptions}
              disabled={busy || vehiclesQuery.isLoading}
              helper={
                selectedVehicle
                  ? `Capacity ${formatWeight(selectedVehicle.maxLoadCapacity, 'kg')}`
                  : 'Select an AVAILABLE vehicle'
              }
              error={errors.vehicleId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="driverId"
          render={({ field: { value, onChange } }) => (
            <SearchableSelectField
              label="Driver"
              required
              value={value}
              onChange={onChange}
              options={driverOptions}
              disabled={busy || driversQuery.isLoading}
              error={errors.driverId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="cargoWeight"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Cargo weight (kg)"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              helper={
                selectedVehicle
                  ? `Max ${formatWeight(selectedVehicle.maxLoadCapacity, 'kg')}`
                  : undefined
              }
              error={errors.cargoWeight?.message || capacityError}
            />
          )}
        />
        <Controller
          control={control}
          name="plannedDistance"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Planned distance (km)"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.plannedDistance?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="revenue"
          render={({ field: { value, onChange } }) => (
            <CurrencyField
              label="Expected revenue"
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.revenue?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Create draft trip"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.TRIPS)}
        loading={busy}
        disabled={busy}
        stacked
      />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  alert: {
    marginBottom: spacing.lg,
  },
})
