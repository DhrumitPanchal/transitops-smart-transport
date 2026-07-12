/**
 * Expo-compatible edit route for /admin/users/:id/edit
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
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useAuth } from '@/hooks/auth/useAuth'
import { useUser, useUpdateUser } from '@/hooks/users'
import { userEditSchema } from '@/validations/userValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { ROLES, ROLE_OPTIONS } from '@/constants/roles'
import { STATUS_LABELS } from '@/constants/statuses'
import { USER_FORM_STATUSES } from '@/constants/formOptions'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const STATUS_OPTIONS = USER_FORM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value] || value,
}))

function toFormValues(user) {
  return {
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    status: user.status || 'ACTIVE',
  }
}

export default function AdminUserEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.USERS_EDIT,
  )
  const userQuery = useUser(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateUser()

  const user = unwrapEntityResponse(userQuery.data, ['item', 'user'])

  const lockSelfDeactivate =
    user &&
    String(user.id) === String(currentUser?.id) &&
    user.role === ROLES.SUPER_ADMIN

  const defaultValues = useMemo(
    () => (user ? toFormValues(user) : undefined),
    [user],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userEditSchema),
    values: defaultValues,
  })

  const busy = updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      await updateMutation.mutateAsync({ id, payload: values })
      toast.success('User updated successfully')
      router.replace(buildPath(ROUTES.ADMIN_USER_DETAIL, { id }))
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

  if (userQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit user" onBack={() => router.back()} />
        <ScreenLoader message="Loading user…" />
      </AppScreen>
    )
  }

  if (userQuery.isError || !user) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit user" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load user"
          message={getResourceErrorMessage(userQuery.error, {
            notFound: 'User not found.',
          })}
          onRetry={() => userQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit user"
        subtitle={user.name}
        onBack={() =>
          router.replace(buildPath(ROUTES.ADMIN_USER_DETAIL, { id: user.id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save user"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection title="Account details">
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
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Email"
              required
              value={value}
              onChangeText={(text) => onChange(String(text || '').toLowerCase())}
              onBlur={onBlur}
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
              disabled={busy || lockSelfDeactivate}
              helper={
                lockSelfDeactivate
                  ? 'You cannot deactivate your own Super Admin account.'
                  : undefined
              }
              error={errors.status?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() =>
          router.replace(buildPath(ROUTES.ADMIN_USER_DETAIL, { id: user.id }))
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
