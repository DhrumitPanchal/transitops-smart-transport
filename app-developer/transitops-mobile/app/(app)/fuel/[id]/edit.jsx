/**
 * Expo-compatible edit route: /fuel/:id/edit
 */
import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  TextField,
  NumberField,
  CurrencyField,
  DateField,
  SearchableSelectField,
  TextAreaField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useFuelLog, useUpdateFuelLog } from '@/hooks/fuel'
import { useVehicles } from '@/hooks/vehicles'
import { useTrips } from '@/hooks/trips'
import { fuelSchema } from '@/validations/fuelValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import {
  buildPath,
  unwrapEntityResponse,
  unwrapListResponse,
} from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

function toFormValues(record) {
  return {
    vehicleId: record.vehicleId || '',
    tripId: record.tripId || '',
    liters: record.liters ?? '',
    cost: record.cost ?? '',
    fuelDate: record.fuelDate || '',
    odometerReading: record.odometerReading ?? '',
    stationName: record.stationName || '',
    notes: record.notes || '',
  }
}

export default function FuelEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.FUEL_EDIT,
  )
  const detailQuery = useFuelLog(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateFuelLog()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )
  const tripsQuery = useTrips(
    { pageSize: 100, sortBy: 'tripNumber', sortDirection: 'desc' },
    { enabled: allowed },
  )

  const record = unwrapEntityResponse(detailQuery.data, ['item', 'fuelLog'])
  const { rows: vehicles } = unwrapListResponse(vehiclesQuery.data)
  const { rows: trips } = unwrapListResponse(tripsQuery.data)

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      })),
    [vehicles],
  )

  const tripOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...trips.map((trip) => ({
        value: trip.id,
        label: `${trip.tripNumber} · ${trip.source} → ${trip.destination}`,
      })),
    ],
    [trips],
  )

  const defaultValues = useMemo(
    () => (record ? toFormValues(record) : undefined),
    [record],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fuelSchema),
    values: defaultValues,
  })

  const busy = updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      await updateMutation.mutateAsync({ id, payload: values })
      toast.success('Fuel log updated successfully')
      router.replace(buildPath(ROUTES.FUEL_DETAIL, { id }))
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, {
          notFound: 'Fuel log not found.',
        }),
      })
    }
  })

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (detailQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit fuel log" onBack={() => router.back()} />
        <ScreenLoader message="Loading fuel log…" />
      </AppScreen>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit fuel log" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load fuel log"
          message={getResourceErrorMessage(detailQuery.error, {
            notFound: 'Fuel log not found.',
          })}
          onRetry={() => detailQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit fuel log"
        subtitle={
          record.vehicleRegistration ||
          record.vehicle?.registrationNumber ||
          undefined
        }
        onBack={() =>
          router.replace(buildPath(ROUTES.FUEL_DETAIL, { id: record.id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save fuel log"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection
        title="Fuel details"
        description="Link to a vehicle and optionally a trip."
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
              disabled={busy}
              error={errors.vehicleId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="tripId"
          render={({ field: { value, onChange } }) => (
            <SearchableSelectField
              label="Trip"
              value={value || ''}
              onChange={onChange}
              options={tripOptions}
              disabled={busy}
              error={errors.tripId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="fuelDate"
          render={({ field: { value, onChange } }) => (
            <DateField
              label="Fuel date"
              required
              value={value}
              onChange={onChange}
              disabled={busy}
              error={errors.fuelDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="stationName"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Station"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.stationName?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Volume and cost">
        <Controller
          control={control}
          name="liters"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Litres"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.liters?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="cost"
          render={({ field: { value, onChange } }) => (
            <CurrencyField
              label="Cost"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.cost?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="odometerReading"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Odometer reading (km)"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.odometerReading?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextAreaField
              label="Notes"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.notes?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() =>
          router.replace(buildPath(ROUTES.FUEL_DETAIL, { id: record.id }))
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
})
