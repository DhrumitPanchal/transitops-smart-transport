import React from 'react'
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
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useCreateVehicle } from '@/hooks/vehicles'
import { vehicleSchema } from '@/validations/vehicleValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { VEHICLE_TYPE_OPTIONS } from '@/constants/appConstants'
import { STATUS_LABELS } from '@/constants/statuses'
import { VEHICLE_FORM_STATUSES } from '@/constants/formOptions'
import { buildPath } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { toast } from '@/components'
import { spacing } from '@/theme'

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

const DEFAULT_VALUES = {
  registrationNumber: '',
  vehicleName: '',
  model: '',
  vehicleType: '',
  maxLoadCapacity: '',
  odometer: '',
  acquisitionCost: '',
  region: '',
  status: 'AVAILABLE',
}

export default function VehicleCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.VEHICLES_CREATE,
  )
  const createMutation = useCreateVehicle()

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      const response = await createMutation.mutateAsync(values)
      const vehicle = response?.data
      toast.success('Vehicle created successfully')
      router.replace(
        vehicle?.id
          ? buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id })
          : ROUTES.VEHICLES,
      )
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

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Add vehicle"
        subtitle="Register a fleet asset"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save vehicle"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection
        title="Vehicle details"
        description="Core identity and classification."
      >
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
              placeholder="KA01AB1234"
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
              placeholder="City Express 1"
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
              placeholder="Starbus Ultra"
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

      <FormSection
        title="Capacity and cost"
        description="Operational limits and acquisition details."
      >
        <Controller
          control={control}
          name="maxLoadCapacity"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Maximum load capacity (kg)"
              required
              value={value}
              onChangeText={onChange}
              placeholder="8000"
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
              placeholder="0"
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
              helper="ON_TRIP and IN_SHOP are set by trip and maintenance workflows."
              error={errors.status?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Create vehicle"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.VEHICLES)}
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
