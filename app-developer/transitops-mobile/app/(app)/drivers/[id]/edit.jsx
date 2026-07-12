/**
 * Expo-compatible equivalent of [id]-edit.jsx.
 * Route: /drivers/:id/edit
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
  DateField,
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
  StatusBadge,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useDriver, useUpdateDriver } from '@/hooks/drivers'
import { driverSchema } from '@/validations/driverValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { LICENCE_CATEGORY_OPTIONS } from '@/constants/appConstants'
import { DRIVER_STATUS, STATUS_LABELS } from '@/constants/statuses'
import { DRIVER_FORM_STATUSES } from '@/constants/formOptions'
import { buildPath } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography } from '@/theme'

const STATUS_OPTIONS = DRIVER_FORM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

function toFormValues(driver) {
  const lockStatus = driver.status === DRIVER_STATUS.ON_TRIP

  return {
    name: driver.name || '',
    licenseNumber: driver.licenseNumber || '',
    licenseCategory: driver.licenseCategory || '',
    licenseExpiryDate: driver.licenseExpiryDate || '',
    contactNumber: driver.contactNumber || '',
    safetyScore: driver.safetyScore ?? '',
    status: lockStatus
      ? DRIVER_STATUS.AVAILABLE
      : DRIVER_FORM_STATUSES.includes(driver.status)
        ? driver.status
        : DRIVER_STATUS.AVAILABLE,
  }
}

export default function DriverEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.DRIVERS_EDIT,
  )
  const driverQuery = useDriver(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateDriver()

  const driver = driverQuery.data?.data
  const lockStatus = driver?.status === DRIVER_STATUS.ON_TRIP

  const schema = useMemo(() => {
    if (lockStatus) return driverSchema.omit({ status: true })
    return driverSchema
  }, [lockStatus])

  const defaultValues = useMemo(
    () => (driver ? toFormValues(driver) : undefined),
    [driver],
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
      toast.success('Driver updated successfully')
      router.replace(buildPath(ROUTES.DRIVER_DETAIL, { id }))
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, {
          notFound: 'Driver not found.',
        }),
      })
    }
  })

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (driverQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit driver" onBack={() => router.back()} />
        <ScreenLoader message="Loading driver…" />
      </AppScreen>
    )
  }

  if (driverQuery.isError || !driver) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit driver" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load driver"
          message={getResourceErrorMessage(driverQuery.error, {
            notFound: 'Driver not found.',
          })}
          onRetry={() => driverQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit driver"
        subtitle={driver.name}
        onBack={() =>
          router.replace(buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save driver"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection title="Identity">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Name"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="contactNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Contact number"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              disabled={busy}
              error={errors.contactNumber?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Licence">
        <Controller
          control={control}
          name="licenseNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Licence number"
              required
              value={value}
              onChangeText={(text) => onChange(String(text || '').toUpperCase())}
              onBlur={onBlur}
              autoCapitalize="characters"
              disabled={busy}
              error={errors.licenseNumber?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="licenseCategory"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Licence category"
              required
              value={value}
              onChange={onChange}
              options={LICENCE_CATEGORY_OPTIONS}
              disabled={busy}
              error={errors.licenseCategory?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="licenseExpiryDate"
          render={({ field: { value, onChange } }) => (
            <DateField
              label="Licence expiry"
              required
              value={value}
              onChange={onChange}
              onChangeText={onChange}
              disabled={busy}
              error={errors.licenseExpiryDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="safetyScore"
          render={({ field: { value, onChange } }) => (
            <NumberField
              label="Safety score (0–100)"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.safetyScore?.message}
            />
          )}
        />
        {lockStatus ? (
          <View style={styles.lockedStatus}>
            <Text style={styles.lockedLabel} allowFontScaling>
              Status
            </Text>
            <StatusBadge status={driver.status} />
            <Text style={styles.lockedHint} allowFontScaling>
              ON_TRIP status is managed by trips and cannot be changed here.
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
          router.replace(buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id }))
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
