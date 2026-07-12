import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
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
import { useCreateFuelLog } from '@/hooks/fuel'
import { useVehicles } from '@/hooks/vehicles'
import { useTrips } from '@/hooks/trips'
import { fuelSchema } from '@/validations/fuelValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { buildPath, unwrapEntityResponse, unwrapListResponse } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const DEFAULT_VALUES = {
  vehicleId: '',
  tripId: '',
  liters: '',
  cost: '',
  fuelDate: '',
  odometerReading: '',
  stationName: '',
  notes: '',
}

export default function FuelCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.FUEL_CREATE,
  )
  const createMutation = useCreateFuelLog()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )
  const tripsQuery = useTrips(
    { pageSize: 100, sortBy: 'tripNumber', sortDirection: 'desc' },
    { enabled: allowed },
  )

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

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fuelSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      const response = await createMutation.mutateAsync(values)
      const record =
        unwrapEntityResponse(response, ['item', 'fuelLog']) || response?.data
      toast.success('Fuel log created successfully')
      router.replace(
        record?.id
          ? buildPath(ROUTES.FUEL_DETAIL, { id: record.id })
          : ROUTES.FUEL,
      )
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

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Create fuel log"
        subtitle="Record a fuel purchase"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to create fuel log"
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
              placeholder="Select vehicle"
              disabled={busy || vehiclesQuery.isLoading}
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
              placeholder="Optional trip"
              disabled={busy || tripsQuery.isLoading}
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
              placeholder="Optional station name"
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
        submitLabel="Create fuel log"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.FUEL)}
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
