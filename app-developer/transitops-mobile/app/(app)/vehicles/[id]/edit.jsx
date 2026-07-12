/**
 * Expo-compatible equivalent of [id]-edit.jsx.
 * Route: /vehicles/:id/edit
 */
import React, { useMemo } from 'react'
import { StyleSheet, View, Text } from 'react-native'
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
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
  StatusBadge,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useVehicle, useUpdateVehicle } from '@/hooks/vehicles'
import { vehicleSchema } from '@/validations/vehicleValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { VEHICLE_TYPE_OPTIONS } from '@/constants/appConstants'
import { STATUS_LABELS, VEHICLE_STATUS } from '@/constants/statuses'
import { VEHICLE_FORM_STATUSES } from '@/constants/formOptions'
import { buildPath } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { toast } from '@/components'
import { colors, spacing, typography } from '@/theme'

const REGION_OPTIONS = [
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Mysuru', label: 'Mysuru' },
  { value: 'Hubballi', label: 'Hubballi' },
  { value: 'Mangaluru', label: 'Mangaluru' },
  { value: 'Chennai', label: 'Chennai' },
]

const STATUS_OPTIONS = VEHICLE_FORM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

function toFormValues(vehicle) {
  const isLifecycleStatus =
    vehicle.status === VEHICLE_STATUS.ON_TRIP ||
    vehicle.status === VEHICLE_STATUS.IN_SHOP

  return {
    registrationNumber: vehicle.registrationNumber || '',
    vehicleName: vehicle.vehicleName || '',
    model: vehicle.model || '',
    vehicleType: vehicle.vehicleType || '',
    maxLoadCapacity: vehicle.maxLoadCapacity ?? '',
    odometer: vehicle.odometer ?? '',
    acquisitionCost: vehicle.acquisitionCost ?? '',
    region: vehicle.region || '',
    status: isLifecycleStatus
      ? VEHICLE_STATUS.AVAILABLE
      : vehicle.status || VEHICLE_STATUS.AVAILABLE,
  }
}

export default function VehicleEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.VEHICLES_EDIT,
  )
  const vehicleQuery = useVehicle(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateVehicle()

  const vehicle = vehicleQuery.data?.data
  const lockStatus =
    vehicle?.status === VEHICLE_STATUS.ON_TRIP ||
    vehicle?.status === VEHICLE_STATUS.IN_SHOP

  const schema = useMemo(() => {
    if (lockStatus) return vehicleSchema.omit({ status: true })
    return vehicleSchema
  }, [lockStatus])

  const defaultValues = useMemo(
    () => (vehicle ? toFormValues(vehicle) : undefined),
    [vehicle],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    values: defaultValues,
  })

  const busy = updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      await updateMutation.mutateAsync({ id, payload: values })
      toast.success('Vehicle updated successfully')
      router.replace(buildPath(ROUTES.VEHICLE_DETAIL, { id }))
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, {
          notFound: 'Vehicle not found.',
        }),
      })
    }
  })

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (vehicleQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit vehicle" onBack={() => router.back()} />
        <ScreenLoader message="Loading vehicle…" />
      </AppScreen>
    )
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit vehicle" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load vehicle"
          message={getResourceErrorMessage(vehicleQuery.error, {
            notFound: 'Vehicle not found.',
          })}
          onRetry={() => vehicleQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit vehicle"
        subtitle={vehicle.registrationNumber}
        onBack={() =>
          router.replace(buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save vehicle"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection title="Vehicle details">
        <Controller
          control={control}
          name="registrationNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Registration number"
              required
              value={value}
              onChangeText={(text) => onChange(String(text || '').toUpperCase())}
              onBlur={onBlur}
              autoCapitalize="characters"
              disabled={busy}
              error={errors.registrationNumber?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="vehicleName"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Vehicle name"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.vehicleName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="model"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Model"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.model?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="vehicleType"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Vehicle type"
              required
              value={value}
              onChange={onChange}
              options={VEHICLE_TYPE_OPTIONS}
              disabled={busy}
              error={errors.vehicleType?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Capacity and cost">
        <Controller
          control={control}
          name="maxLoadCapacity"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Maximum load capacity (kg)"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.maxLoadCapacity?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="odometer"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Odometer (km)"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.odometer?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="acquisitionCost"
          render={({ field: { value, onChange } }) => (
            <CurrencyField
              label="Acquisition cost"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.acquisitionCost?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="region"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Region"
              required
              value={value}
              onChange={onChange}
              options={REGION_OPTIONS}
              disabled={busy}
              error={errors.region?.message}
            />
          )}
        />
        {lockStatus ? (
          <View style={styles.lockedStatus}>
            <Text style={styles.lockedLabel} allowFontScaling>
              Status
            </Text>
            <StatusBadge status={vehicle.status} />
            <Text style={styles.lockedHint} allowFontScaling>
              ON_TRIP and IN_SHOP are managed by trip and maintenance workflows
              and cannot be changed here.
            </Text>
          </View>
        ) : (
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <SelectField
                label="Status"
                required
                value={value}
                onChange={onChange}
                options={STATUS_OPTIONS}
                disabled={busy}
                helper="Cannot set ON_TRIP or IN_SHOP manually."
                error={errors.status?.message}
              />
            )}
          />
        )}
      </FormSection>

      <FormActions
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() =>
          router.replace(buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id }))
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
  lockedStatus: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  lockedLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  lockedHint: {
    ...typography.caption,
    color: colors.muted,
  },
})
