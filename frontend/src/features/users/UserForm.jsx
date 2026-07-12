import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  userCreateSchema,
  userEditSchema,
} from '../../validations/userValidation'
import { ROLE_OPTIONS } from '../../constants/roles'
import { USER_STATUS_OPTIONS } from '../../constants/statuses'
import TextField from '../../components/forms/TextField'
import EmailField from '../../components/forms/EmailField'
import PasswordField from '../../components/forms/PasswordField'
import SelectField from '../../components/forms/SelectField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import {
  DEFAULT_USER_CREATE_VALUES,
  DEFAULT_USER_EDIT_VALUES,
  normalizeUserCreatePayload,
  normalizeUserUpdatePayload,
} from './userFormDefaults'
import { applyApiFieldErrors, getUserErrorMessage } from './userErrors'

export default function UserForm({
  mode = 'create',
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting = false,
  serverError = null,
  lockSelfDeactivate = false,
}) {
  const isCreate = mode === 'create'
  const schema = isCreate ? userCreateSchema : userEditSchema

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...(isCreate ? DEFAULT_USER_CREATE_VALUES : DEFAULT_USER_EDIT_VALUES),
      ...defaultValues,
    },
  })

  const busy = isSubmitting

  const handleFormSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')

    try {
      const payload = isCreate
        ? normalizeUserCreatePayload(values)
        : normalizeUserUpdatePayload(values)
      await onSubmit(payload)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', { message: getUserErrorMessage(error) })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save user">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Account details"
        description="Passwords are required only when creating a user and are never shown again."
      >
        <TextField
          name="name"
          label="Name"
          required
          disabled={busy}
          registration={register('name')}
          error={errors.name?.message}
        />
        <EmailField
          name="email"
          label="Email"
          required
          disabled={busy}
          registration={register('email')}
          error={errors.email?.message}
        />
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <SelectField
            name="role"
            label="Role"
            required
            options={ROLE_OPTIONS}
            disabled={busy}
            registration={register('role')}
            error={errors.role?.message}
          />
          <SelectField
            name="status"
            label="Status"
            required
            options={USER_STATUS_OPTIONS}
            disabled={busy || lockSelfDeactivate}
            registration={register('status')}
            error={errors.status?.message}
            helperText={
              lockSelfDeactivate
                ? 'You cannot deactivate your own Super Admin account.'
                : undefined
            }
          />
        </div>
      </FormSection>

      {isCreate ? (
        <FormSection title="Password">
          <PasswordField
            name="password"
            label="Password"
            required
            disabled={busy}
            registration={register('password')}
            error={errors.password?.message}
          />
          <PasswordField
            name="confirmPassword"
            label="Confirm password"
            required
            disabled={busy}
            registration={register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </FormSection>
      ) : null}

      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel || (isCreate ? 'Create user' : 'Save changes')}
        loading={busy}
        disabled={busy}
      />
    </form>
  )
}
