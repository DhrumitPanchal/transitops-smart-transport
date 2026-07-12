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
  DateField,
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useCreateDriver } from '@/hooks/drivers'
import { driverSchema } from '@/validations/driverValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { LICENCE_CATEGORY_OPTIONS } from '@/constants/appConstants'
import { DRIVER_STATUS, STATUS_LABELS } from '@/constants/statuses'
import { DRIVER_FORM_STATUSES } from '@/constants/formOptions'
import { buildPath } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const STATUS_OPTIONS = DRIVER_FORM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

const DEFAULT_VALUES = {
  name: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiryDate: '',
  contactNumber: '',
  safetyScore: '80',
  status: DRIVER_STATUS.AVAILABLE,
}

export default function DriverCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.DRIVERS_CREATE,
  )
  const createMutation = useCreateDriver()

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      const response = await createMutation.mutateAsync(values)
      const driver = response?.data
      toast.success('Driver created successfully')
      router.replace(
        driver?.id
          ? buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id })
          : ROUTES.DRIVERS,
      )
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

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Add driver"
        subtitle="Register for fleet operations"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save driver"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection title="Identity" description="Name and contact details.">
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

      <FormSection title="Licence" description="Compliance and validity.">
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
              helper="ON_TRIP is set by trip dispatch."
              error={errors.status?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Create driver"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.DRIVERS)}
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
