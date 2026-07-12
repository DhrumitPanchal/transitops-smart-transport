/**
 * Expo-compatible edit route: /expenses/:id/edit
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
import { useExpense, useUpdateExpense } from '@/hooks/expenses'
import { useVehicles } from '@/hooks/vehicles'
import { useTrips } from '@/hooks/trips'
import { expenseSchema } from '@/validations/expenseValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { EXPENSE_TYPE_OPTIONS } from '@/constants/appConstants'
import {
  buildPath,
  unwrapEntityResponse,
  unwrapListResponse,
} from '@/utils/helpers'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { spacing } from '@/theme'

function toFormValues(record) {
  return {
    vehicleId: record.vehicleId || '',
    tripId: record.tripId || '',
    expenseType: record.expenseType || '',
    amount: record.amount ?? '',
    expenseDate: record.expenseDate || '',
    description: record.description || '',
  }
}

export default function ExpenseEditScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.EXPENSES_EDIT,
  )
  const detailQuery = useExpense(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateExpense()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )
  const tripsQuery = useTrips(
    { pageSize: 100, sortBy: 'tripNumber', sortDirection: 'desc' },
    { enabled: allowed },
  )

  const record = unwrapEntityResponse(detailQuery.data, ['item', 'expense'])
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

  const defaultValues = useMemo(
    () => (record ? toFormValues(record) : undefined),
    [record],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    values: defaultValues,
  })

  const busy = updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    clearErrors('root')
    try {
      await updateMutation.mutateAsync({ id, payload: values })
      toast.success('Expense updated successfully')
      router.replace(buildPath(ROUTES.EXPENSE_DETAIL, { id }))
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

  if (detailQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit expense" onBack={() => router.back()} />
        <ScreenLoader message="Loading expense…" />
      </AppScreen>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Edit expense" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load expense"
          message={getResourceErrorMessage(detailQuery.error, {
            notFound: 'Expense not found.',
          })}
          onRetry={() => detailQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Edit expense"
        subtitle={
          EXPENSE_TYPE_OPTIONS.find((opt) => opt.value === record.expenseType)
            ?.label || record.expenseType
        }
        onBack={() =>
          router.replace(buildPath(ROUTES.EXPENSE_DETAIL, { id: record.id }))
        }
      />

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Unable to save expense"
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
              disabled={busy}
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
              disabled={busy}
              error={errors.tripId?.message}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() =>
          router.replace(buildPath(ROUTES.EXPENSE_DETAIL, { id: record.id }))
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
