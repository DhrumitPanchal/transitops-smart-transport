/**
 * Expo-compatible detail route for /vehicles/:id
 * (folder [id]/index.jsx — equivalent intent of a flat [id].jsx)
 */
import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  StatusBadge,
  Card,
  SectionTitle,
  Button,
  ConfirmModal,
  InlineAlert,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useVehicle, useRetireVehicle } from '@/hooks/vehicles'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { VEHICLE_STATUS } from '@/constants/statuses'
import { VEHICLE_TYPE_LABELS } from '@/constants/appConstants'
import { buildPath } from '@/utils/helpers'
import {
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatWeight,
} from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { toast } from '@/components'
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

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.VEHICLES_VIEW,
  )
  const { hasPermission } = usePermissions()
  const vehicleQuery = useVehicle(id, { enabled: allowed && Boolean(id) })
  const retireMutation = useRetireVehicle()
  const [retireOpen, setRetireOpen] = useState(false)
  const [retireError, setRetireError] = useState(null)

  const vehicle = vehicleQuery.data?.data
  const canEdit = hasPermission(PERMISSIONS.VEHICLES_EDIT)
  const canRetire =
    hasPermission(PERMISSIONS.VEHICLES_RETIRE) &&
    vehicle &&
    vehicle.status !== VEHICLE_STATUS.ON_TRIP &&
    vehicle.status !== VEHICLE_STATUS.RETIRED

  const handleRetire = async () => {
    if (!vehicle || retireMutation.isPending) return
    try {
      await retireMutation.mutateAsync(vehicle.id)
      toast.success('Vehicle retired successfully')
      setRetireOpen(false)
      setRetireError(null)
    } catch (error) {
      setRetireError(
        getResourceErrorMessage(error, { notFound: 'Vehicle not found.' }),
      )
    }
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (vehicleQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Vehicle details" onBack={() => router.back()} />
        <ScreenLoader message="Loading vehicle…" />
      </AppScreen>
    )
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Vehicle details" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load vehicle"
          message={getResourceErrorMessage(vehicleQuery.error, {
            notFound: 'Vehicle not found.',
          })}
          onRetry={() => vehicleQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={vehicle.registrationNumber}
        subtitle={vehicle.vehicleName}
        onBack={() => router.replace(ROUTES.VEHICLES)}
      />

      <View style={styles.actions}>
        {canEdit ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.VEHICLE_EDIT, { id: vehicle.id }))
            }
            style={styles.actionBtn}
          />
        ) : null}
        {hasPermission(PERMISSIONS.VEHICLES_RETIRE) ? (
          <Button
            title="Retire"
            variant="danger"
            disabled={!canRetire}
            onPress={() => {
              setRetireError(null)
              setRetireOpen(true)
            }}
            style={styles.actionBtn}
          />
        ) : null}
      </View>

      <Card>
        <SectionTitle title="Vehicle information" />
        <DetailRow label="Registration">
          <Text style={styles.valueText}>{vehicle.registrationNumber}</Text>
        </DetailRow>
        <DetailRow label="Name">
          <Text style={styles.valueText}>{vehicle.vehicleName}</Text>
        </DetailRow>
        <DetailRow label="Model">
          <Text style={styles.valueText}>{vehicle.model}</Text>
        </DetailRow>
        <DetailRow label="Type">
          <Text style={styles.valueText}>
            {VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
          </Text>
        </DetailRow>
        <DetailRow label="Capacity">
          <Text style={styles.valueText}>
            {formatWeight(vehicle.maxLoadCapacity, 'kg')}
          </Text>
        </DetailRow>
        <DetailRow label="Odometer">
          <Text style={styles.valueText}>
            {formatDistance(vehicle.odometer, 'km')}
          </Text>
        </DetailRow>
        <DetailRow label="Acquisition cost">
          <Text style={styles.valueText}>
            {formatCurrency(vehicle.acquisitionCost)}
          </Text>
        </DetailRow>
        <DetailRow label="Region">
          <Text style={styles.valueText}>{vehicle.region || '—'}</Text>
        </DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={vehicle.status} />
        </DetailRow>
        <DetailRow label="Created">
          <Text style={styles.valueText}>
            {formatDateTime(vehicle.createdAt)}
          </Text>
        </DetailRow>
        <DetailRow label="Updated">
          <Text style={styles.valueText}>
            {formatDateTime(vehicle.updatedAt)}
          </Text>
        </DetailRow>
      </Card>

      <ConfirmModal
        visible={retireOpen}
        title="Retire vehicle"
        message={
          vehicle
            ? `Retire ${vehicle.registrationNumber} (${vehicle.vehicleName})? This cannot be undone from normal operations.`
            : 'Retire this vehicle?'
        }
        confirmLabel="Retire"
        destructive
        loading={retireMutation.isPending}
        onConfirm={handleRetire}
        onCancel={() => {
          if (retireMutation.isPending) return
          setRetireOpen(false)
          setRetireError(null)
        }}
      />

      {retireError ? (
        <InlineAlert
          variant="error"
          title="Unable to retire"
          message={retireError}
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
    minWidth: 120,
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
