/**
 * Expo-compatible equivalent of [id]-edit.jsx.
 * Route: /trips/:id/edit — only DRAFT trips can be edited.
 */
import React, { useEffect, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  TextField,
  NumberField,
  CurrencyField,
  SearchableSelectField,
  FormSection,
  FormActions,
  InlineAlert,
  Button,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useTrip, useUpdateDraftTrip } from '@/hooks/trips'
import { useAvailableVehicles } from '@/hooks/vehicles'
import { useAvailableDrivers } from '@/hooks/drivers'
import {
  tripSchema,
  validateTripResources,
} from '@/validations/tripValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { TRIP_STATUS } from '@/constants/statuses'
import { VALIDATION_MESSAGES } from '@/constants/validationMessages'
import { LICENCE_CATEGORY_LABELS } from '@/constants/appConstants'
import { buildPath } from '@/utils/helpers'
import { formatDate, formatWeight } from '@/utils/formatters'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

function toFormValues(trip) {
  return {
    source: trip.source || '',
    destination: trip.destination || '',
    vehicleId: trip.vehicleId || '',
    driverId: trip.driverId || '',
    cargoWeight: trip.cargoWeight ?? '',
    plannedDistance: trip.plannedDistance ?? '',
    revenue: trip.revenue ?? '',
  }
}

export default function TripEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.TRIPS_EDIT_DRAFT,
  )
  const tripQuery = useTrip(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateDraftTrip()
  const vehiclesQuery = useAvailableVehicles({}, { enabled: allowed })
  const driversQuery = useAvailableDrivers({}, { enabled: allowed })

  const trip = tripQuery.data?.data
  const isDraft = trip?.status === TRIP_STATUS.DRAFT

  const vehicles = useMemo(() => {
    const list = [...(vehiclesQuery.data?.data || [])]
    if (trip?.vehicle && !list.some((item) => item.id === trip.vehicle.id)) {
      list.unshift(trip.vehicle)
    } else if (
      trip?.vehicleId &&
      !list.some((item) => item.id === trip.vehicleId)
    ) {
      list.unshift({
        id: trip.vehicleId,
        registrationNumber: trip.vehicleRegistration || trip.vehicleId,
        vehicleName: '',
        maxLoadCapacity: trip.vehicleCapacity,
        status: 'AVAILABLE',
      })
    }
    return list
  }, [vehiclesQuery.data?.data, trip])

  const drivers = useMemo(() => {
    const list = [...(driversQuery.data?.data || [])]
    if (trip?.driver && !list.some((item) => item.id === trip.driver.id)) {
      list.unshift(trip.driver)
    } else if (
      trip?.driverId &&
      !list.some((item) => item.id === trip.driverId)
    ) {
      list.unshift({
        id: trip.driverId,
        name: trip.driverName || trip.driverId,
        licenseCategory: '',
        licenseExpiryDate: null,
        status: 'AVAILABLE',
      })
    }
    return list
  }, [driversQuery.data?.data, trip])

  const defaultValues = useMemo(
    () => (trip && isDraft ? toFormValues(trip) : undefined),
    [trip, isDraft],
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
    values: defaultValues,
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

  const busy = updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy || !isDraft) return
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
      await updateMutation.mutateAsync({ id, payload: values })
      toast.success('Draft trip updated')
      router.replace(buildPath(ROUTES.TRIP_DETAIL, { id }))
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

  if (tripQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit trip" onBack={() => router.back()} />
        <ScreenLoader message="Loading trip…" />
      </AppScreen>
    )
  }

  if (tripQuery.isError || !trip) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit trip" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load trip"
          message={getResourceErrorMessage(tripQuery.error, {
            notFound: 'Trip not found.',
          })}
          onRetry={() => tripQuery.refetch()}
        />
      </AppScreen>
    )
  }

  if (!isDraft) {
    return (
      <AppScreen scroll edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Edit trip"
          onBack={() =>
            router.replace(buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }))
          }
        />
        <InlineAlert
          variant="warning"
          title="Draft only"
          message={`Only draft trips can be edited. This trip is ${trip.status}.`}
        />
        <Button
          title="View trip details"
          variant="secondary"
          onPress={() =>
            router.replace(buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }))
          }
          style={styles.backBtn}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit draft trip"
        subtitle={trip.tripNumber || trip.id}
        onBack={() =>
          router.replace(buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save trip"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection title="Route">
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

      <FormSection title="Resources">
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
        submitLabel="Save draft"
        onSubmit={onSubmit}
        onCancel={() =>
          router.replace(buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }))
        }
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
  backBtn: {
    marginTop: spacing.lg,
  },
})
