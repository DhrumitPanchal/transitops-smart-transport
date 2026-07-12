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
  CurrencyField,
  DateField,
  SelectField,
  SearchableSelectField,
  TextAreaField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useCreateMaintenance } from '@/hooks/maintenance'
import { useVehicles } from '@/hooks/vehicles'
import { maintenanceSchema } from '@/validations/maintenanceValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import {
  MAINTENANCE_TYPE_OPTIONS,
} from '@/constants/appConstants'
import { MAINTENANCE_STATUS, STATUS_LABELS, VEHICLE_STATUS } from '@/constants/statuses'
import { MAINTENANCE_CREATE_STATUSES } from '@/constants/formOptions'
import { buildPath, unwrapEntityResponse, unwrapListResponse } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const STATUS_OPTIONS = MAINTENANCE_CREATE_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

const DEFAULT_VALUES = {
  vehicleId: '',
  maintenanceType: '',
  description: '',
  startDate: '',
  expectedEndDate: '',
  cost: '',
  vendorName: '',
  notes: '',
  status: MAINTENANCE_STATUS.OPEN,
}

export default function MaintenanceCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.MAINTENANCE_CREATE,
  )
  const createMutation = useCreateMaintenance()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )

  const { rows: vehicles } = unwrapListResponse(vehiclesQuery.data)
  const vehicleOptions = useMemo(
    () =>
      vehicles
        .filter(
          (vehicle) =>
            vehicle.status !== VEHICLE_STATUS.ON_TRIP &&
            vehicle.status !== VEHICLE_STATUS.RETIRED,
        )
        .map((vehicle) => ({
          value: vehicle.id,
          label: `${vehicle.registrationNumber} · ${vehicle.vehicleName} (${STATUS_LABELS[vehicle.status] || vehicle.status})`,
        })),
    [vehicles],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      const response = await createMutation.mutateAsync(values)
      const record =
        unwrapEntityResponse(response, ['item', 'maintenance']) ||
        response?.data
      toast.success('Maintenance created successfully')
      router.replace(
        record?.id
          ? buildPath(ROUTES.MAINTENANCE_DETAIL, { id: record.id })
          : ROUTES.MAINTENANCE,
      )
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, {
          notFound: 'Maintenance record not found.',
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
        title="Create maintenance"
        subtitle="Schedule workshop work"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to create maintenance"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection
        title="Work order"
        description="ON_TRIP and RETIRED vehicles cannot enter maintenance."
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
              placeholder="Select eligible vehicle"
              disabled={busy || vehiclesQuery.isLoading}
              error={errors.vehicleId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="maintenanceType"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Maintenance type"
              required
              value={value}
              onChange={onChange}
              options={MAINTENANCE_TYPE_OPTIONS}
              disabled={busy}
              error={errors.maintenanceType?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextAreaField
              label="Description"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.description?.message}
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
              helper="Only Open or In Progress can be set on create."
              error={errors.status?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Schedule and cost">
        <Controller
          control={control}
          name="startDate"
          render={({ field: { value, onChange } }) => (
            <DateField
              label="Start date"
              required
              value={value}
              onChange={onChange}
              disabled={busy}
              error={errors.startDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="expectedEndDate"
          render={({ field: { value, onChange } }) => (
            <DateField
              label="Expected end date"
              required
              value={value}
              onChange={onChange}
              disabled={busy}
              error={errors.expectedEndDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="cost"
          render={({ field: { value, onChange } }) => (
            <CurrencyField
              label="Estimated cost"
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
          name="vendorName"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Vendor"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Optional workshop name"
              disabled={busy}
              error={errors.vendorName?.message}
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
        submitLabel="Create maintenance"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.MAINTENANCE)}
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
