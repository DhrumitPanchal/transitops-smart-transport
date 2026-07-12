/**
 * Expo-compatible detail route for /drivers/:id
 */
import React, { useState } from 'react'
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native'
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
  SelectField,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import {
  useDriver,
  useChangeDriverStatus,
  useSuspendDriver,
} from '@/hooks/drivers'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { DRIVER_STATUS, STATUS_LABELS } from '@/constants/statuses'
import { LICENCE_CATEGORY_LABELS } from '@/constants/appConstants'
import { buildPath } from '@/utils/helpers'
import { formatDate, formatDateTime } from '@/utils/formatters'
import {
  isLicenseExpired,
  isLicenseExpiringSoon,
} from '@/utils/dateHelpers'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography, radius, shadows } from '@/theme'

const CHANGE_STATUS_OPTIONS = [DRIVER_STATUS.AVAILABLE, DRIVER_STATUS.OFF_DUTY].map(
  (value) => ({
    value,
    label: STATUS_LABELS[value] || value,
  }),
)

function getLicenseValidityLabel(expiryDate) {
  if (isLicenseExpired(expiryDate)) return 'Expired'
  if (isLicenseExpiringSoon(expiryDate, 30)) return 'Expiring soon'
  return 'Valid'
}

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

export default function DriverDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.DRIVERS_VIEW,
  )
  const { hasPermission } = usePermissions()
  const driverQuery = useDriver(id, { enabled: allowed && Boolean(id) })
  const changeStatusMutation = useChangeDriverStatus()
  const suspendMutation = useSuspendDriver()

  const [statusOpen, setStatusOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState(DRIVER_STATUS.AVAILABLE)
  const [actionError, setActionError] = useState(null)

  const driver = driverQuery.data?.data
  const canEdit = hasPermission(PERMISSIONS.DRIVERS_EDIT)
  const canSuspend =
    hasPermission(PERMISSIONS.DRIVERS_SUSPEND) &&
    driver &&
    driver.status !== DRIVER_STATUS.ON_TRIP &&
    driver.status !== DRIVER_STATUS.SUSPENDED
  const canChangeStatus =
    hasPermission(PERMISSIONS.DRIVERS_CHANGE_STATUS) &&
    driver &&
    driver.status !== DRIVER_STATUS.ON_TRIP

  const handleChangeStatus = async () => {
    if (!driver || changeStatusMutation.isPending || !nextStatus) return
    try {
      await changeStatusMutation.mutateAsync({
        id: driver.id,
        status: nextStatus,
      })
      toast.success('Driver status updated')
      setStatusOpen(false)
      setActionError(null)
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'Driver not found.' }),
      )
    }
  }

  const handleSuspend = async () => {
    if (!driver || suspendMutation.isPending) return
    try {
      await suspendMutation.mutateAsync(driver.id)
      toast.success('Driver suspended')
      setSuspendOpen(false)
      setActionError(null)
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'Driver not found.' }),
      )
    }
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (driverQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Driver details" onBack={() => router.back()} />
        <ScreenLoader message="Loading driver…" />
      </AppScreen>
    )
  }

  if (driverQuery.isError || !driver) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Driver details" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load driver"
          message={getResourceErrorMessage(driverQuery.error, {
            notFound: 'Driver not found.',
          })}
          onRetry={() => driverQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={driver.name}
        subtitle={driver.licenseNumber}
        onBack={() => router.replace(ROUTES.DRIVERS)}
      />

      <View style={styles.actions}>
        {canEdit ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.DRIVER_EDIT, { id: driver.id }))
            }
            style={styles.actionBtn}
          />
        ) : null}
        {hasPermission(PERMISSIONS.DRIVERS_CHANGE_STATUS) ? (
          <Button
            title="Change status"
            variant="secondary"
            disabled={!canChangeStatus}
            onPress={() => {
              setNextStatus(
                driver.status === DRIVER_STATUS.OFF_DUTY
                  ? DRIVER_STATUS.OFF_DUTY
                  : DRIVER_STATUS.AVAILABLE,
              )
              setActionError(null)
              setStatusOpen(true)
            }}
            style={styles.actionBtn}
          />
        ) : null}
        {hasPermission(PERMISSIONS.DRIVERS_SUSPEND) ? (
          <Button
            title="Suspend"
            variant="danger"
            disabled={!canSuspend}
            onPress={() => {
              setActionError(null)
              setSuspendOpen(true)
            }}
            style={styles.actionBtn}
          />
        ) : null}
      </View>

      {!canSuspend &&
      driver.status === DRIVER_STATUS.ON_TRIP &&
      hasPermission(PERMISSIONS.DRIVERS_SUSPEND) ? (
        <InlineAlert
          variant="warning"
          title="On trip"
          message="Cannot suspend a driver who is currently ON_TRIP. Complete or cancel the trip first."
          style={styles.alert}
        />
      ) : null}

      <Card>
        <SectionTitle title="Driver information" />
        <DetailRow label="Name">
          <Text style={styles.valueText}>{driver.name}</Text>
        </DetailRow>
        <DetailRow label="Contact">
          <Text style={styles.valueText}>{driver.contactNumber}</Text>
        </DetailRow>
        <DetailRow label="Licence number">
          <Text style={styles.valueText}>{driver.licenseNumber}</Text>
        </DetailRow>
        <DetailRow label="Licence category">
          <Text style={styles.valueText}>
            {LICENCE_CATEGORY_LABELS[driver.licenseCategory] ||
              driver.licenseCategory}
          </Text>
        </DetailRow>
        <DetailRow label="Licence expiry">
          <Text style={styles.valueText}>
            {formatDate(driver.licenseExpiryDate)}
          </Text>
        </DetailRow>
        <DetailRow label="Licence validity">
          <Text style={styles.valueText}>
            {getLicenseValidityLabel(driver.licenseExpiryDate)}
          </Text>
        </DetailRow>
        <DetailRow label="Safety score">
          <Text style={styles.valueText}>{driver.safetyScore ?? '—'}</Text>
        </DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={driver.status} />
        </DetailRow>
        <DetailRow label="Created">
          <Text style={styles.valueText}>
            {formatDateTime(driver.createdAt)}
          </Text>
        </DetailRow>
        <DetailRow label="Updated">
          <Text style={styles.valueText}>
            {formatDateTime(driver.updatedAt)}
          </Text>
        </DetailRow>
      </Card>

      <ConfirmModal
        visible={suspendOpen}
        title="Suspend driver"
        message={
          driver
            ? `Suspend ${driver.name} (${driver.licenseNumber})? They will be unavailable for trips.`
            : 'Suspend this driver?'
        }
        confirmLabel="Suspend"
        destructive
        loading={suspendMutation.isPending}
        onConfirm={handleSuspend}
        onCancel={() => {
          if (suspendMutation.isPending) return
          setSuspendOpen(false)
        }}
      />

      <Modal
        visible={statusOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (changeStatusMutation.isPending) return
          setStatusOpen(false)
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (changeStatusMutation.isPending) return
            setStatusOpen(false)
          }}
        >
          <Pressable
            style={styles.modalDialog}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle} allowFontScaling>
              Change driver status
            </Text>
            <Text style={styles.modalMessage} allowFontScaling>
              Update status for {driver.name}. ON_TRIP cannot be set manually.
            </Text>
            <SelectField
              label="New status"
              required
              value={nextStatus}
              onChange={setNextStatus}
              options={CHANGE_STATUS_OPTIONS}
              disabled={changeStatusMutation.isPending}
            />
            {actionError && statusOpen ? (
              <InlineAlert
                variant="error"
                title="Unable to update"
                message={actionError}
                style={styles.alert}
              />
            ) : null}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setStatusOpen(false)}
                disabled={changeStatusMutation.isPending}
                style={styles.actionBtn}
              />
              <Button
                title="Update status"
                onPress={handleChangeStatus}
                loading={changeStatusMutation.isPending}
                disabled={!nextStatus}
                style={styles.actionBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalDialog: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
})
