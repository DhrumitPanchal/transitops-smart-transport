import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleSchema } from '../../validations/vehicleValidation'
import { VEHICLE_TYPE_OPTIONS } from '../../constants/appConstants'
import TextField from '../../components/forms/TextField'
import NumberField from '../../components/forms/NumberField'
import SelectField from '../../components/forms/SelectField'
import CurrencyField from '../../components/forms/CurrencyField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import StatusBadge from '../../components/common/StatusBadge'
import {
  DEFAULT_VEHICLE_FORM_VALUES,
  VEHICLE_FORM_STATUS_OPTIONS,
  VEHICLE_REGION_OPTIONS,
} from './vehicleFormDefaults'
import {
  applyApiFieldErrors,
  getVehicleErrorMessage,
} from './vehicleErrors'

export default function VehicleForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save vehicle',
  isSubmitting = false,
  serverError = null,
  lockStatus = false,
  lockedStatusValue = null,
}) {
  const schema = useMemo(() => {
    if (lockStatus) {
      return vehicleSchema.omit({ status: true })
    }
    return vehicleSchema
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
      ...DEFAULT_VEHICLE_FORM_VALUES,
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
        message: getVehicleErrorMessage(error),
      })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save vehicle">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Vehicle details"
        description="Core identity and classification for this fleet asset."
      >
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <TextField
            name="registrationNumber"
            label="Registration number"
            required
            placeholder="KA01AB1234"
            disabled={busy}
            className="uppercase"
            registration={register('registrationNumber')}
            error={errors.registrationNumber?.message}
          />
          <TextField
            name="vehicleName"
            label="Vehicle name"
            required
            placeholder="City Express 1"
            disabled={busy}
            registration={register('vehicleName')}
            error={errors.vehicleName?.message}
          />
          <TextField
            name="model"
            label="Model"
            required
            placeholder="Starbus Ultra"
            disabled={busy}
            registration={register('model')}
            error={errors.model?.message}
          />
          <SelectField
            name="vehicleType"
            label="Vehicle type"
            required
            options={VEHICLE_TYPE_OPTIONS}
            disabled={busy}
            registration={register('vehicleType')}
            error={errors.vehicleType?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title="Capacity and cost"
        description="Operational limits and acquisition details."
      >
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <NumberField
            name="maxLoadCapacity"
            label="Maximum load capacity (kg)"
            required
            placeholder="8000"
            disabled={busy}
            registration={register('maxLoadCapacity')}
            error={errors.maxLoadCapacity?.message}
          />
          <NumberField
            name="odometer"
            label="Odometer (km)"
            required
            placeholder="0"
            disabled={busy}
            registration={register('odometer')}
            error={errors.odometer?.message}
          />
          <CurrencyField
            name="acquisitionCost"
            label="Acquisition cost"
            required
            placeholder="0"
            disabled={busy}
            registration={register('acquisitionCost')}
            error={errors.acquisitionCost?.message}
          />
          <SelectField
            name="region"
            label="Region"
            required
            options={VEHICLE_REGION_OPTIONS}
            disabled={busy}
            registration={register('region')}
            error={errors.region?.message}
          />
          {lockStatus ? (
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Status</p>
              <StatusBadge status={lockedStatusValue} />
              <p className="mt-2 text-xs text-slate-500">
                ON_TRIP and IN_SHOP are managed by trip and maintenance
                workflows and cannot be changed here.
              </p>
            </div>
          ) : (
            <SelectField
              name="status"
              label="Status"
              required
              options={VEHICLE_FORM_STATUS_OPTIONS}
              disabled={busy}
              helperText="ON_TRIP and IN_SHOP are set by trip and maintenance workflows."
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
