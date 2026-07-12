import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { driverSchema } from '../../validations/driverValidation'
import { LICENCE_CATEGORY_OPTIONS } from '../../constants/appConstants'
import TextField from '../../components/forms/TextField'
import NumberField from '../../components/forms/NumberField'
import SelectField from '../../components/forms/SelectField'
import DateField from '../../components/forms/DateField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import StatusBadge from '../../components/common/StatusBadge'
import {
  DEFAULT_DRIVER_FORM_VALUES,
  DRIVER_FORM_STATUS_OPTIONS,
} from './driverFormDefaults'
import { applyApiFieldErrors, getDriverErrorMessage } from './driverErrors'

export default function DriverForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save driver',
  isSubmitting = false,
  serverError = null,
  lockStatus = false,
  lockedStatusValue = null,
}) {
  const schema = useMemo(() => {
    if (lockStatus) {
      return driverSchema.omit({ status: true })
    }
    return driverSchema
  }, [lockStatus])

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...DEFAULT_DRIVER_FORM_VALUES,
      ...defaultValues,
    },
  })

  const busy = isSubmitting

  const handleFormSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')

    try {
      await onSubmit(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getDriverErrorMessage(error),
      })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save driver">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Driver identity"
        description="Personal and contact details for this driver."
      >
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <TextField
            name="name"
            label="Name"
            required
            placeholder="Ravi Kumar"
            disabled={busy}
            registration={register('name')}
            error={errors.name?.message}
          />
          <TextField
            name="contactNumber"
            label="Contact number"
            required
            placeholder="+91 98765 43210"
            disabled={busy}
            registration={register('contactNumber')}
            error={errors.contactNumber?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title="Licence details"
        description="Licence information used for dispatch eligibility."
      >
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <TextField
            name="licenseNumber"
            label="Licence number"
            required
            placeholder="KA2020001"
            disabled={busy}
            className="uppercase"
            registration={register('licenseNumber')}
            error={errors.licenseNumber?.message}
          />
          <SelectField
            name="licenseCategory"
            label="Licence category"
            required
            options={LICENCE_CATEGORY_OPTIONS}
            disabled={busy}
            registration={register('licenseCategory')}
            error={errors.licenseCategory?.message}
          />
          <DateField
            name="licenseExpiryDate"
            label="Licence expiry date"
            required
            disabled={busy}
            registration={register('licenseExpiryDate')}
            error={errors.licenseExpiryDate?.message}
          />
          <NumberField
            name="safetyScore"
            label="Safety score"
            required
            placeholder="0-100"
            disabled={busy}
            registration={register('safetyScore')}
            error={errors.safetyScore?.message}
            helperText="Score must be between 0 and 100."
          />
          {lockStatus ? (
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Status</p>
              <StatusBadge status={lockedStatusValue} />
              <p className="mt-2 text-xs text-slate-500">
                ON_TRIP is managed by trip workflows and cannot be changed here.
              </p>
            </div>
          ) : (
            <SelectField
              name="status"
              label="Status"
              required
              options={DRIVER_FORM_STATUS_OPTIONS}
              disabled={busy}
              helperText="ON_TRIP cannot be selected manually. Expired licences cannot be AVAILABLE."
              registration={register('status')}
              error={errors.status?.message}
            />
          )}
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        loading={busy}
        disabled={busy}
      />
    </form>
  )
}
