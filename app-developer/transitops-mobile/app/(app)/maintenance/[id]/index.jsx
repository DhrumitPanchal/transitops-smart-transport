/**
 * Expo-compatible detail route for /maintenance/:id
 */
import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  StatusBadge,
  Card,
  SectionTitle,
  Button,
  InlineAlert,
  DateField,
  CurrencyField,
  TextAreaField,
  FormSection,
  FormActions,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import {
  useMaintenance,
  useCompleteMaintenance,
  useCancelMaintenance,
} from '@/hooks/maintenance'
import {
  createMaintenanceCompletionSchema,
  maintenanceCancellationSchema,
} from '@/validations/maintenanceValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { MAINTENANCE_STATUS } from '@/constants/statuses'
import { MAINTENANCE_TYPE_LABELS } from '@/constants/appConstants'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/utils/formatters'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography } from '@/theme'

function DetailRow({ label, children }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label} allowFontScaling>
        {label}
      </Text>
      <View style={styles.value}>{children}</View>
    </View>
  )
}

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.MAINTENANCE_VIEW,
  )
  const { hasPermission } = usePermissions()
  const detailQuery = useMaintenance(id, { enabled: allowed && Boolean(id) })
  const completeMutation = useCompleteMaintenance()
  const cancelMutation = useCancelMaintenance()

  const [panel, setPanel] = useState(null)
  const [actionError, setActionError] = useState(null)

  const record = unwrapEntityResponse(detailQuery.data, [
    'item',
    'maintenance',
  ])

  const canEdit =
    hasPermission(PERMISSIONS.MAINTENANCE_EDIT) &&
    record &&
    [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
      record.status,
    )
  const canComplete =
    hasPermission(PERMISSIONS.MAINTENANCE_COMPLETE) &&
    record &&
    [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
      record.status,
    )
  const canCancel =
    hasPermission(PERMISSIONS.MAINTENANCE_CANCEL) &&
    record &&
    [MAINTENANCE_STATUS.OPEN, MAINTENANCE_STATUS.IN_PROGRESS].includes(
      record.status,
    )

  const completionSchema = useMemo(
    () => createMaintenanceCompletionSchema(record?.startDate),
    [record?.startDate],
  )

  const completeForm = useForm({
    resolver: zodResolver(completionSchema),
    values: {
      completionDate: new Date().toISOString().slice(0, 10),
      finalCost: record?.cost ?? '',
      notes: '',
    },
  })

  const cancelForm = useForm({
    resolver: zodResolver(maintenanceCancellationSchema),
    defaultValues: { reason: '' },
  })

  const handleComplete = completeForm.handleSubmit(async (values) => {
    if (!record || completeMutation.isPending) return
    setActionError(null)
    try {
      await completeMutation.mutateAsync({ id: record.id, payload: values })
      toast.success('Maintenance completed')
      setPanel(null)
      detailQuery.refetch()
    } catch (error) {
      applyApiFieldErrors(completeForm.setError, error)
      setActionError(
        getResourceErrorMessage(error, {
          notFound: 'Maintenance record not found.',
        }),
      )
    }
  })

  const handleCancel = cancelForm.handleSubmit(async (values) => {
    if (!record || cancelMutation.isPending) return
    setActionError(null)
    try {
      await cancelMutation.mutateAsync({ id: record.id, payload: values })
      toast.success('Maintenance cancelled')
      setPanel(null)
      detailQuery.refetch()
    } catch (error) {
      applyApiFieldErrors(cancelForm.setError, error)
      setActionError(
        getResourceErrorMessage(error, {
          notFound: 'Maintenance record not found.',
        }),
      )
    }
  })

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (detailQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Maintenance details" onBack={() => router.back()} />
        <ScreenLoader message="Loading maintenance…" />
      </AppScreen>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Maintenance details" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load maintenance"
          message={getResourceErrorMessage(detailQuery.error, {
            notFound: 'Maintenance record not found.',
          })}
          onRetry={() => detailQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={
          record.vehicleRegistration ||
          record.vehicle?.registrationNumber ||
          'Maintenance'
        }
        subtitle={
          MAINTENANCE_TYPE_LABELS[record.maintenanceType] ||
          record.maintenanceType
        }
        onBack={() => router.replace(ROUTES.MAINTENANCE)}
      />

      <View style={styles.actions}>
        {canEdit ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.MAINTENANCE_EDIT, { id: record.id }))
            }
            style={styles.actionBtn}
          />
        ) : null}
        {canComplete ? (
          <Button
            title="Complete"
            variant="primary"
            onPress={() => {
              setActionError(null)
              completeForm.reset({
                completionDate: new Date().toISOString().slice(0, 10),
                finalCost: record.cost ?? '',
                notes: '',
              })
              setPanel('complete')
            }}
            style={styles.actionBtn}
          />
        ) : null}
        {canCancel ? (
          <Button
            title="Cancel"
            variant="danger"
            onPress={() => {
              setActionError(null)
              cancelForm.reset({ reason: '' })
              setPanel('cancel')
            }}
            style={styles.actionBtn}
          />
        ) : null}
      </View>

      {actionError ? (
        <InlineAlert
          variant="error"
          title="Action failed"
          message={actionError}
          style={styles.alert}
        />
      ) : null}

      {panel === 'complete' ? (
        <FormSection
          title="Complete maintenance"
          description="Enter completion date and final cost."
        >
          <Controller
            control={completeForm.control}
            name="completionDate"
            render={({ field: { value, onChange } }) => (
              <DateField
                label="Completion date"
                required
                value={value}
                onChange={onChange}
                disabled={completeMutation.isPending}
                error={completeForm.formState.errors.completionDate?.message}
              />
            )}
          />
          <Controller
            control={completeForm.control}
            name="finalCost"
            render={({ field: { value, onChange } }) => (
              <CurrencyField
                label="Final cost"
                required
                value={value}
                onChangeText={onChange}
                disabled={completeMutation.isPending}
                error={completeForm.formState.errors.finalCost?.message}
              />
            )}
          />
          <Controller
            control={completeForm.control}
            name="notes"
            render={({ field: { value, onChange } }) => (
              <TextAreaField
                label="Notes"
                value={value}
                onChangeText={onChange}
                disabled={completeMutation.isPending}
                error={completeForm.formState.errors.notes?.message}
              />
            )}
          />
          <FormActions
            submitLabel="Confirm complete"
            cancelLabel="Dismiss"
            onSubmit={handleComplete}
            onCancel={() => setPanel(null)}
            loading={completeMutation.isPending}
            disabled={completeMutation.isPending}
            stacked
          />
        </FormSection>
      ) : null}

      {panel === 'cancel' ? (
        <FormSection
          title="Cancel maintenance"
          description="Provide a reason for cancellation."
        >
          <Controller
            control={cancelForm.control}
            name="reason"
            render={({ field: { value, onChange } }) => (
              <TextAreaField
                label="Reason"
                required
                value={value}
                onChangeText={onChange}
                disabled={cancelMutation.isPending}
                error={cancelForm.formState.errors.reason?.message}
              />
            )}
          />
          <FormActions
            submitLabel="Confirm cancel"
            cancelLabel="Dismiss"
            submitVariant="danger"
            onSubmit={handleCancel}
            onCancel={() => setPanel(null)}
            loading={cancelMutation.isPending}
            disabled={cancelMutation.isPending}
            stacked
          />
        </FormSection>
      ) : null}

      <Card>
        <SectionTitle title="Work order" />
        <DetailRow label="Status">
          <StatusBadge status={record.status} />
        </DetailRow>
        <DetailRow label="Vehicle">
          <Text style={styles.valueText}>
            {record.vehicleRegistration ||
              record.vehicle?.registrationNumber ||
              '—'}
            {record.vehicleName || record.vehicle?.vehicleName
              ? ` · ${record.vehicleName || record.vehicle?.vehicleName}`
              : ''}
          </Text>
        </DetailRow>
        <DetailRow label="Type">
          <Text style={styles.valueText}>
            {MAINTENANCE_TYPE_LABELS[record.maintenanceType] ||
              record.maintenanceType}
          </Text>
        </DetailRow>
        <DetailRow label="Description">
          <Text style={styles.valueText}>{record.description || '—'}</Text>
        </DetailRow>
        <DetailRow label="Start date">
          <Text style={styles.valueText}>{formatDate(record.startDate)}</Text>
        </DetailRow>
        <DetailRow label="Expected end">
          <Text style={styles.valueText}>
            {formatDate(record.expectedEndDate)}
          </Text>
        </DetailRow>
        <DetailRow label="Estimated cost">
          <Text style={styles.valueText}>{formatCurrency(record.cost)}</Text>
        </DetailRow>
        <DetailRow label="Final cost">
          <Text style={styles.valueText}>
            {formatCurrency(record.finalCost)}
          </Text>
        </DetailRow>
        <DetailRow label="Completion date">
          <Text style={styles.valueText}>
            {formatDate(record.completionDate)}
          </Text>
        </DetailRow>
        <DetailRow label="Vendor">
          <Text style={styles.valueText}>{record.vendorName || '—'}</Text>
        </DetailRow>
        <DetailRow label="Cancel reason">
          <Text style={styles.valueText}>{record.cancelReason || '—'}</Text>
        </DetailRow>
        <DetailRow label="Notes">
          <Text style={styles.valueText}>{record.notes || '—'}</Text>
        </DetailRow>
        <DetailRow label="Updated">
          <Text style={styles.valueText}>
            {formatDateTime(record.updatedAt)}
          </Text>
        </DetailRow>
      </Card>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: 110,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
  },
  value: {
    alignItems: 'flex-start',
  },
  valueText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  alert: {
    marginBottom: spacing.lg,
  },
})
