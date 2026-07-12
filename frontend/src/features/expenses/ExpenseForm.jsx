import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseSchema } from '../../validations/expenseValidation'
import { EXPENSE_TYPE_OPTIONS } from '../../constants/appConstants'
import TextAreaField from '../../components/forms/TextAreaField'
import CurrencyField from '../../components/forms/CurrencyField'
import DateField from '../../components/forms/DateField'
import SelectField from '../../components/forms/SelectField'
import SearchableSelectField from '../../components/forms/SearchableSelectField'
import FormSection from '../../components/forms/FormSection'
import FormActions from '../../components/forms/FormActions'
import InlineAlert from '../../components/feedback/InlineAlert'
import { useVehicles } from '../../hooks/vehicles'
import { useTrips } from '../../hooks/trips'
import {
  DEFAULT_EXPENSE_FORM_VALUES,
  normalizeExpensePayload,
} from './expenseFormDefaults'
import { applyApiFieldErrors, getExpenseErrorMessage } from './expenseErrors'

export default function ExpenseForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save expense',
  isSubmitting = false,
  serverError = null,
}) {
  const vehiclesQuery = useVehicles({
    pageSize: 100,
    sortBy: 'registrationNumber',
  })
  const tripsQuery = useTrips({ pageSize: 100, sortBy: 'createdAt' })

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      ...DEFAULT_EXPENSE_FORM_VALUES,
      ...defaultValues,
    },
  })

  const vehicleOptions = useMemo(
    () => [
      { value: '', label: 'No vehicle' },
      ...(vehiclesQuery.data?.data || []).map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      })),
    ],
    [vehiclesQuery.data?.data],
  )

  const tripOptions = useMemo(
    () => [
      { value: '', label: 'No trip' },
      ...(tripsQuery.data?.data || []).map((trip) => ({
        value: trip.id,
        label: `${trip.tripNumber || trip.id} · ${trip.source} → ${trip.destination}`,
      })),
    ],
    [tripsQuery.data?.data],
  )

  const busy = isSubmitting

  const handleFormSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')

    try {
      await onSubmit(normalizeExpensePayload(values))
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getExpenseErrorMessage(error),
      })
    }
  })

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      {serverError || errors.root?.message ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save expense">
            {serverError || errors.root?.message}
          </InlineAlert>
        </div>
      ) : null}

      <FormSection
        title="Expense details"
        description="Vehicle and trip links are optional."
      >
        <SelectField
          name="expenseType"
          label="Expense type"
          required
          options={EXPENSE_TYPE_OPTIONS}
          disabled={busy}
          registration={register('expenseType')}
          error={errors.expenseType?.message}
        />
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <DateField
            name="expenseDate"
            label="Expense date"
            required
            disabled={busy}
            registration={register('expenseDate')}
            error={errors.expenseDate?.message}
          />
          <CurrencyField
            name="amount"
            label="Amount"
            required
            disabled={busy}
            registration={register('amount')}
            error={errors.amount?.message}
          />
        </div>
        <TextAreaField
          name="description"
          label="Description"
          required
          disabled={busy}
          registration={register('description')}
          error={errors.description?.message}
        />
      </FormSection>

      <FormSection title="Links">
        <Controller
          name="vehicleId"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              name="vehicleId"
              label="Vehicle"
              disabled={busy || vehiclesQuery.isLoading}
              options={vehicleOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.vehicleId?.message}
              helperText="Optional"
            />
          )}
        />
        <Controller
          name="tripId"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              name="tripId"
              label="Trip"
              disabled={busy || tripsQuery.isLoading}
              options={tripOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.tripId?.message}
              helperText="Optional"
            />
          )}
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
