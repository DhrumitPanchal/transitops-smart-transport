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
import { DEFAULT_MAINTENANCE_FORM_VALUES } from './maintenanceFormDefaults'
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
    setValue,
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
        description="ON_TRIP and RETIRED vehicles cannot enter maintenance. Start work later to place the vehicle IN_SHOP."
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
              onChange={(value) => {
                field.onChange(value)
                const selected = eligibleVehicles.find((item) => item.id === value)
                if (selected?.currentOdometer != null) {
                  setValue('currentOdometer', String(selected.currentOdometer))
                }
              }}
              error={errors.vehicleId?.message}
              helperText="Creating a SCHEDULED record does not change vehicle status until maintenance is started."
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
          <TextField
            name="title"
            label="Title"
            required
            disabled={busy}
            registration={register('title')}
            error={errors.title?.message}
          />
        </div>
      </FormSection>

      <FormSection title="Schedule and cost">
        <TextAreaField
          name="description"
          label="Description"
          disabled={busy}
          registration={register('description')}
          error={errors.description?.message}
        />
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <DateField
            name="scheduledDate"
            label="Scheduled date"
            required
            disabled={busy}
            registration={register('scheduledDate')}
            error={errors.scheduledDate?.message}
          />
          <TextField
            name="serviceCenter"
            label="Service center"
            required
            disabled={busy}
            registration={register('serviceCenter')}
            error={errors.serviceCenter?.message}
          />
          <CurrencyField
            name="estimatedCost"
            label="Estimated cost"
            required
            disabled={busy}
            registration={register('estimatedCost')}
            error={errors.estimatedCost?.message}
          />
          <TextField
            name="currentOdometer"
            label="Current odometer"
            required
            disabled={busy}
            registration={register('currentOdometer')}
            error={errors.currentOdometer?.message}
          />
          <TextField
            name="nextServiceOdometer"
            label="Next service odometer"
            disabled={busy}
            registration={register('nextServiceOdometer')}
            error={errors.nextServiceOdometer?.message}
          />
        </div>
        <TextAreaField
          name="remarks"
          label="Remarks"
          disabled={busy}
          registration={register('remarks')}
          error={errors.remarks?.message}
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
