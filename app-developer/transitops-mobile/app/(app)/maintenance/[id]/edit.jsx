/**
 * Expo-compatible edit route: /maintenance/:id/edit
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
import { useMaintenance, useUpdateMaintenance } from '@/hooks/maintenance'
import { useVehicles } from '@/hooks/vehicles'
import { maintenanceSchema } from '@/validations/maintenanceValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { MAINTENANCE_TYPE_OPTIONS } from '@/constants/appConstants'
import {
  MAINTENANCE_STATUS,
  STATUS_LABELS,
  VEHICLE_STATUS,
} from '@/constants/statuses'
import { MAINTENANCE_CREATE_STATUSES } from '@/constants/formOptions'
import {
  buildPath,
  unwrapEntityResponse,
  unwrapListResponse,
} from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const STATUS_OPTIONS = MAINTENANCE_CREATE_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

function toFormValues(record) {
  return {
    vehicleId: record.vehicleId || '',
    maintenanceType: record.maintenanceType || '',
    description: record.description || '',
    startDate: record.startDate || '',
    expectedEndDate: record.expectedEndDate || '',
    cost: record.cost ?? '',
    vendorName: record.vendorName || '',
    notes: record.notes || '',
    status: [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
      record.status,
    )
      ? record.status
      : MAINTENANCE_STATUS.OPEN,
  }
}

export default function MaintenanceEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.MAINTENANCE_EDIT,
  )
  const detailQuery = useMaintenance(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateMaintenance()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )

  const record = unwrapEntityResponse(detailQuery.data, [
    'item',
    'maintenance',
  ])
  const { rows: vehicles } = unwrapListResponse(vehiclesQuery.data)

  const vehicleOptions = useMemo(() => {
    const currentId = record?.vehicleId
    return vehicles
      .filter(
        (vehicle) =>
          vehicle.id === currentId ||
          (vehicle.status !== VEHICLE_STATUS.ON_TRIP &&
            vehicle.status !== VEHICLE_STATUS.RETIRED),
      )
      .map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      }))
  }, [vehicles, record?.vehicleId])

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
    resolver: zodResolver(maintenanceSchema),
    values: defaultValues,
  })

  const busy = updateMutation.isPending
  const isEditable =
    record &&
    [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
      record.status,
    )

  const onSubmit = handleSubmit(async (values) => {
    if (busy || !isEditable) return
    clearErrors('root')
    try {
      await updateMutation.mutateAsync({ id, payload: values })
      toast.success('Maintenance updated successfully')
      router.replace(buildPath(ROUTES.MAINTENANCE_DETAIL, { id }))
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

  if (detailQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit maintenance" onBack={() => router.back()} />
        <ScreenLoader message="Loading maintenance…" />
      </AppScreen>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit maintenance" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load maintenance"
          message={getResourceErrorMessage(detailQuery.error, {
            notFound: 'Maintenance record not found.',
          })}
          onRetry={() => detailQuery.refetch()}
        />
      </AppScreen>
    )
  }

  if (!isEditable) {
    return (
      <AppScreen scroll edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Edit maintenance"
          onBack={() =>
            router.replace(buildPath(ROUTES.MAINTENANCE_DETAIL, { id }))
          }
        />
        <InlineAlert
          variant="warning"
          title="Not editable"
          message="Completed or cancelled maintenance cannot be edited."
        />
        <FormActions
          submitLabel="Back to details"
          onSubmit={() =>
            router.replace(buildPath(ROUTES.MAINTENANCE_DETAIL, { id }))
          }
          stacked
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit maintenance"
        subtitle={
          record.vehicleRegistration ||
          record.vehicle?.registrationNumber ||
          undefined
        }
        onBack={() =>
          router.replace(buildPath(ROUTES.MAINTENANCE_DETAIL, { id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save maintenance"
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
              disabled={busy}
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
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() =>
          router.replace(buildPath(ROUTES.MAINTENANCE_DETAIL, { id }))
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
