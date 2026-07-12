import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  CurrencyField,
  DateField,
  SelectField,
  SearchableSelectField,
  TextAreaField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useCreateExpense } from '@/hooks/expenses'
import { useVehicles } from '@/hooks/vehicles'
import { useTrips } from '@/hooks/trips'
import { expenseSchema } from '@/validations/expenseValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { EXPENSE_TYPE_OPTIONS } from '@/constants/appConstants'
import { buildPath, unwrapEntityResponse, unwrapListResponse } from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

const DEFAULT_VALUES = {
  vehicleId: '',
  tripId: '',
  expenseType: '',
  amount: '',
  expenseDate: '',
  description: '',
}

export default function ExpenseCreateScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.EXPENSES_CREATE,
  )
  const createMutation = useCreateExpense()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )
  const tripsQuery = useTrips(
    { pageSize: 100, sortBy: 'tripNumber', sortDirection: 'desc' },
    { enabled: allowed },
  )

  const { rows: vehicles } = unwrapListResponse(vehiclesQuery.data)
  const { rows: trips } = unwrapListResponse(tripsQuery.data)

  const vehicleOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      })),
    ],
    [vehicles],
  )

  const tripOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...trips.map((trip) => ({
        value: trip.id,
        label: `${trip.tripNumber} · ${trip.source} → ${trip.destination}`,
      })),
    ],
    [trips],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const busy = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      const response = await createMutation.mutateAsync(values)
      const record =
        unwrapEntityResponse(response, ['item', 'expense']) || response?.data
      toast.success('Expense created successfully')
      router.replace(
        record?.id
          ? buildPath(ROUTES.EXPENSE_DETAIL, { id: record.id })
          : ROUTES.EXPENSES,
      )
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, {
          notFound: 'Expense not found.',
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
        title="Create expense"
        subtitle="Record an operational cost"
        onBack={() => router.back()}
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to create expense"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <FormSection
        title="Expense details"
        description="Vehicle and trip links are optional."
      >
        <Controller
          control={control}
          name="expenseType"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Expense type"
              required
              value={value}
              onChange={onChange}
              options={EXPENSE_TYPE_OPTIONS}
              disabled={busy}
              error={errors.expenseType?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="expenseDate"
          render={({ field: { value, onChange } }) => (
            <DateField
              label="Expense date"
              required
              value={value}
              onChange={onChange}
              disabled={busy}
              error={errors.expenseDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange } }) => (
            <CurrencyField
              label="Amount"
              required
              value={value}
              onChangeText={onChange}
              disabled={busy}
              error={errors.amount?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextAreaField
              label="Description"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              disabled={busy}
              error={errors.description?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Links">
        <Controller
          control={control}
          name="vehicleId"
          render={({ field: { value, onChange } }) => (
            <SearchableSelectField
              label="Vehicle"
              value={value || ''}
              onChange={onChange}
              options={vehicleOptions}
              placeholder="Optional vehicle"
              disabled={busy || vehiclesQuery.isLoading}
              error={errors.vehicleId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="tripId"
          render={({ field: { value, onChange } }) => (
            <SearchableSelectField
              label="Trip"
              value={value || ''}
              onChange={onChange}
              options={tripOptions}
              placeholder="Optional trip"
              disabled={busy || tripsQuery.isLoading}
              error={errors.tripId?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Create expense"
        onSubmit={onSubmit}
        onCancel={() => router.replace(ROUTES.EXPENSES)}
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
