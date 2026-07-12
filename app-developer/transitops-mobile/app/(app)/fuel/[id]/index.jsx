/**
 * Expo-compatible detail route for /fuel/:id
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
import { useFuelLog, useDeleteFuelLog } from '@/hooks/fuel'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDistance,
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

function getCostPerLitre(record) {
  if (record.costPerLitre != null) return record.costPerLitre
  const liters = Number(record.liters)
  const cost = Number(record.cost)
  if (!Number.isFinite(liters) || liters <= 0 || !Number.isFinite(cost)) {
    return null
  }
  return Math.round((cost / liters) * 100) / 100
}

export default function FuelDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.FUEL_VIEW,
  )
  const { hasPermission } = usePermissions()
  const detailQuery = useFuelLog(id, { enabled: allowed && Boolean(id) })
  const deleteMutation = useDeleteFuelLog()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const record = unwrapEntityResponse(detailQuery.data, ['item', 'fuelLog'])
  const canEdit = hasPermission(PERMISSIONS.FUEL_EDIT)
  const canDelete = hasPermission(PERMISSIONS.FUEL_DELETE)
  const costPerLitre = record ? getCostPerLitre(record) : null

  const handleDelete = async () => {
    if (!record || deleteMutation.isPending) return
    try {
      await deleteMutation.mutateAsync(record.id)
      toast.success('Fuel log deleted successfully')
      setDeleteOpen(false)
      setDeleteError(null)
      router.replace(ROUTES.FUEL)
    } catch (error) {
      setDeleteError(
        getResourceErrorMessage(error, {
          notFound: 'Fuel log not found.',
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
        <ScreenHeader title="Fuel log details" onBack={() => router.back()} />
        <ScreenLoader message="Loading fuel log…" />
      </AppScreen>
    )
  }

  if (detailQuery.isError || !record) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Fuel log details" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load fuel log"
          message={getResourceErrorMessage(detailQuery.error, {
            notFound: 'Fuel log not found.',
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
          'Fuel log'
        }
        subtitle={record.stationName || formatDate(record.fuelDate)}
        onBack={() => router.replace(ROUTES.FUEL)}
      />

      <View style={styles.actions}>
        {canEdit ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.FUEL_EDIT, { id: record.id }))
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
        <SectionTitle title="Fuel information" />
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
        <DetailRow label="Fuel date">
          <Text style={styles.valueText}>{formatDate(record.fuelDate)}</Text>
        </DetailRow>
        <DetailRow label="Station">
          <Text style={styles.valueText}>{record.stationName || '—'}</Text>
        </DetailRow>
        <DetailRow label="Litres">
          <Text style={styles.valueText}>{record.liters ?? '—'}</Text>
        </DetailRow>
        <DetailRow label="Cost">
          <Text style={styles.valueText}>{formatCurrency(record.cost)}</Text>
        </DetailRow>
        <DetailRow label="Cost per litre">
          <Text style={styles.valueText}>
            {costPerLitre != null ? formatCurrency(costPerLitre) : '—'}
          </Text>
        </DetailRow>
        <DetailRow label="Odometer">
          <Text style={styles.valueText}>
            {formatDistance(record.odometerReading, 'km')}
          </Text>
        </DetailRow>
        <DetailRow label="Notes">
          <Text style={styles.valueText}>{record.notes || '—'}</Text>
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
        title="Delete fuel log"
        message={
          record
            ? `Delete fuel log for ${record.vehicleRegistration || record.vehicle?.registrationNumber || 'this vehicle'} on ${formatDate(record.fuelDate)}? This cannot be undone.`
            : 'Delete this fuel log?'
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
