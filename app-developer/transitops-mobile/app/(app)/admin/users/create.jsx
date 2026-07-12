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
  PasswordField,
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useCreateUser } from '@/hooks/users'
import { userCreateSchema } from '@/validations/userValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { ROLE_OPTIONS } from '@/constants/roles'
import { STATUS_LABELS } from '@/constants/statuses'
import { USER_FORM_STATUSES } from '@/constants/formOptions'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const STATUS_OPTIONS = USER_FORM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

const DEFAULT_VALUES = {
  name: '',
  email: '',
  role: '',
  status: 'ACTIVE',
  password: '',
  confirmPassword: '',
}

export default function AdminUserCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.USERS_CREATE,
  )
  const createMutation = useCreateUser()

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userCreateSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      const { confirmPassword: _confirm, ...payload } = values
      const response = await createMutation.mutateAsync(payload)
      const user =
        unwrapEntityResponse(response, ['item', 'user']) || response?.data
      toast.success('User created successfully')
      router.replace(
        user?.id
          ? buildPath(ROUTES.ADMIN_USER_DETAIL, { id: user.id })
          : ROUTES.ADMIN_USERS,
      )
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, {
          notFound: 'User not found.',
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
        title="Add user"
        subtitle="Password required on create"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save user"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection
        title="Account details"
        description="Passwords are never returned by the API."
      >
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
              placeholder="Full name"
              disabled={busy}
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Email"
              required
              value={value}
              onChangeText={(text) => onChange(String(text || '').toLowerCase())}
              onBlur={onBlur}
              placeholder="user@transitops.com"
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={busy}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="role"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Role"
              required
              value={value}
              onChange={onChange}
              options={ROLE_OPTIONS}
              disabled={busy}
              error={errors.role?.message}
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

      <FormSection title="Password">
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <PasswordField
              label="Password"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange, onBlur } }) => (
            <PasswordField
              label="Confirm password"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.confirmPassword?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Create user"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.ADMIN_USERS)}
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
