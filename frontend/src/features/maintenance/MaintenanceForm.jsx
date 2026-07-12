import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { maintenanceSchema } from '../../validations/maintenanceValidation'
import { MAINTENANCE_TYPE_OPTIONS } from '../../constants/appConstants'
import { VEHICLE_STATUS } from '../../constants/statuses'
import TextField from '../../components/forms/TextField'
import TextAreaField from '../../components/forms/TextAreaField'
import CurrencyField from '../../components/forms/CurrencyField'
import DateField from '../../components/forms/DateField'
import SelectField from '../../components/forms/SelectField'
import SearchableSelectField from '../../components/forms/SearchableSelectField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import { useVehicles } from '../../hooks/vehicles'
import {
  DEFAULT_MAINTENANCE_FORM_VALUES,
  MAINTENANCE_CREATE_STATUS_OPTIONS,
} from './maintenanceFormDefaults'
import {
  applyApiFieldErrors,
  getMaintenanceErrorMessage,
} from './maintenanceErrors'

export default function MaintenanceForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save maintenance',
  isSubmitting = false,
  serverError = null,
  lockVehicle = false,
}) {
  const vehiclesQuery = useVehicles({
    pageSize: 100,
    sortBy: 'registrationNumber',
  })

  const eligibleVehicles = useMemo(() => {
    const items = vehiclesQuery.data?.data || []
    return items.filter(
      (vehicle) =>
        vehicle.status !== VEHICLE_STATUS.ON_TRIP &&
        vehicle.status !== VEHICLE_STATUS.RETIRED,
    )
  }, [vehiclesQuery.data?.data])

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      ...DEFAULT_MAINTENANCE_FORM_VALUES,
      ...defaultValues,
    },
  })

  const vehicleOptions = eligibleVehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.registrationNumber} · ${vehicle.vehicleName} · ${vehicle.status}`,
  }))

  const busy = isSubmitting

  const handleFormSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')

    try {
      await onSubmit(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getMaintenanceErrorMessage(error),
      })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save maintenance">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Vehicle and type"
        description="ON_TRIP and RETIRED vehicles cannot enter maintenance."
      >
        <Controller
          name="vehicleId"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              name="vehicleId"
              label="Vehicle"
              required
              disabled={busy || lockVehicle || vehiclesQuery.isLoading}
              options={vehicleOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.vehicleId?.message}
              helperText="Creating OPEN or IN_PROGRESS maintenance marks the vehicle IN_SHOP."
            />
          )}
        />

        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <SelectField
            name="maintenanceType"
            label="Maintenance type"
            required
            options={MAINTENANCE_TYPE_OPTIONS}
            disabled={busy}
            registration={register('maintenanceType')}
            error={errors.maintenanceType?.message}
          />
          <SelectField
            name="status"
            label="Status"
            required
            options={MAINTENANCE_CREATE_STATUS_OPTIONS}
            disabled={busy}
            registration={register('status')}
            error={errors.status?.message}
          />
        </div>
      </FormSection>

      <FormSection title="Schedule and cost">
        <TextAreaField
          name="description"
          label="Description"
          required
          disabled={busy}
          registration={register('description')}
          error={errors.description?.message}
        />
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <DateField
            name="startDate"
            label="Start date"
            required
            disabled={busy}
            registration={register('startDate')}
            error={errors.startDate?.message}
          />
          <DateField
            name="expectedEndDate"
            label="Expected end date"
            required
            disabled={busy}
            registration={register('expectedEndDate')}
            error={errors.expectedEndDate?.message}
          />
          <CurrencyField
            name="cost"
            label="Estimated cost"
            required
            disabled={busy}
            registration={register('cost')}
            error={errors.cost?.message}
          />
          <TextField
            name="vendorName"
            label="Vendor"
            disabled={busy}
            registration={register('vendorName')}
            error={errors.vendorName?.message}
          />
        </div>
        <TextAreaField
          name="notes"
          label="Notes"
          disabled={busy}
          registration={register('notes')}
          error={errors.notes?.message}
        />
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
