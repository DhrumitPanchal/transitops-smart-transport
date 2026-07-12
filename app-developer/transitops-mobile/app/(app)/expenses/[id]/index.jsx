/**
 * Expo-compatible detail route for /expenses/:id
 */
import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  Card,
  SectionTitle,
  Button,
  ConfirmModal,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useExpense, useDeleteExpense } from '@/hooks/expenses'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { EXPENSE_TYPE_LABELS } from '@/constants/appConstants'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
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

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.EXPENSES_VIEW,
  )
  const { hasPermission } = usePermissions()
  const detailQuery = useExpense(id, { enabled: allowed && Boolean(id) })
  const deleteMutation = useDeleteExpense()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const record = unwrapEntityResponse(detailQuery.data, ['item', 'expense'])
  const canEdit = hasPermission(PERMISSIONS.EXPENSES_EDIT)
  const canDelete = hasPermission(PERMISSIONS.EXPENSES_DELETE)

  const handleDelete = async () => {
    if (!record || deleteMutation.isPending) return
    try {
      await deleteMutation.mutateAsync(record.id)
      toast.success('Expense deleted successfully')
      setDeleteOpen(false)
      setDeleteError(null)
      router.replace(ROUTES.EXPENSES)
    } catch (error) {
      setDeleteError(
        getResourceErrorMessage(error, {
          notFound: 'Expense not found.',
        }),
      )
    }
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (detailQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Expense details" onBack={() => router.back()} />
        <ScreenLoader message="Loading expense…" />
      </AppScreen>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Expense details" onBack={() => router.back()} />
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
        title={
          EXPENSE_TYPE_LABELS[record.expenseType] || record.expenseType
        }
        subtitle={formatCurrency(record.amount)}
        onBack={() => router.replace(ROUTES.EXPENSES)}
      />

      <View style={styles.actions}>
        {canEdit ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.EXPENSE_EDIT, { id: record.id }))
            }
            style={styles.actionBtn}
          />
        ) : null}
        {canDelete ? (
          <Button
            title="Delete"
            variant="danger"
            onPress={() => {
              setDeleteError(null)
              setDeleteOpen(true)
            }}
            style={styles.actionBtn}
          />
        ) : null}
      </View>

      <Card>
        <SectionTitle title="Expense information" />
        <DetailRow label="Type">
          <Text style={styles.valueText}>
            {EXPENSE_TYPE_LABELS[record.expenseType] || record.expenseType}
          </Text>
        </DetailRow>
        <DetailRow label="Amount">
          <Text style={styles.valueText}>{formatCurrency(record.amount)}</Text>
        </DetailRow>
        <DetailRow label="Expense date">
          <Text style={styles.valueText}>
            {formatDate(record.expenseDate)}
          </Text>
        </DetailRow>
        <DetailRow label="Description">
          <Text style={styles.valueText}>{record.description || '—'}</Text>
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
        <DetailRow label="Trip">
          <Text style={styles.valueText}>
            {record.tripNumber || record.trip?.tripNumber
              ? `Trip ${record.tripNumber || record.trip?.tripNumber}`
              : '—'}
          </Text>
        </DetailRow>
        <DetailRow label="Created">
          <Text style={styles.valueText}>
            {formatDateTime(record.createdAt)}
          </Text>
        </DetailRow>
        <DetailRow label="Updated">
          <Text style={styles.valueText}>
            {formatDateTime(record.updatedAt)}
          </Text>
        </DetailRow>
      </Card>

      <ConfirmModal
        visible={deleteOpen}
        title="Delete expense"
        message={
          record
            ? `Delete ${EXPENSE_TYPE_LABELS[record.expenseType] || record.expenseType} expense of ${formatCurrency(record.amount)} on ${formatDate(record.expenseDate)}? This cannot be undone.`
            : 'Delete this expense?'
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => {
          if (deleteMutation.isPending) return
          setDeleteOpen(false)
          setDeleteError(null)
        }}
      />

      {deleteError ? (
        <InlineAlert
          variant="error"
          title="Unable to delete"
          message={deleteError}
          style={styles.alert}
        />
      ) : null}
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
    marginTop: spacing.lg,
  },
})
