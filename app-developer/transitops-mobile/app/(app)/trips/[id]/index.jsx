/**
 * Expo-compatible detail route for /trips/:id
 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native'
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
  ConfirmModal,
  InlineAlert,
  NumberField,
  CurrencyField,
  TextAreaField,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import {
  useTrip,
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
} from '@/hooks/trips'
import {
  createTripCompletionSchema,
  tripCancellationSchema,
} from '@/validations/tripValidation'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { TRIP_STATUS } from '@/constants/statuses'
import { buildPath } from '@/utils/helpers'
import {
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatFuel,
  formatWeight,
} from '@/utils/formatters'
import { applyApiFieldErrors, getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography, radius, shadows } from '@/theme'

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

function CompleteTripModal({
  visible,
  trip,
  loading,
  onClose,
  onConfirm,
}) {
  const canComplete = trip?.status === TRIP_STATUS.DISPATCHED
  const schema = useMemo(
    () => createTripCompletionSchema(trip?.startOdometer),
    [trip?.startOdometer],
  )

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      finalOdometer: '',
      fuelConsumed: '',
      fuelCost: '',
      revenue: trip?.revenue ?? '',
    },
  })

  useEffect(() => {
    if (visible) {
      reset({
        finalOdometer: '',
        fuelConsumed: '',
        fuelCost: '',
        revenue: trip?.revenue ?? '',
      })
      clearErrors()
    }
  }, [visible, trip, reset, clearErrors])

  const onSubmit = handleSubmit(async (values) => {
    if (!canComplete || loading) return
    clearErrors('root')
    try {
      await onConfirm?.(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, { notFound: 'Trip not found.' }),
      })
    }
  })

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalDialog}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle} allowFontScaling>
              Complete trip
            </Text>
            <Text style={styles.modalMessage} allowFontScaling>
              Complete {trip?.tripNumber || trip?.id}. Vehicle and driver return
              to AVAILABLE when successful.
            </Text>

            {!canComplete ? (
              <InlineAlert
                variant="warning"
                title="Unavailable"
                message="Only dispatched trips can be completed."
              />
            ) : (
              <>
                <Controller
                  control={control}
                  name="finalOdometer"
                  render={({ field: { value, onChange } }) => (
                    <NumberField
                      label="Final odometer (km)"
                      required
                      value={value}
                      onChangeText={onChange}
                      disabled={loading}
                      helper={`Start odometer: ${trip?.startOdometer ?? '—'}`}
                      error={errors.finalOdometer?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="fuelConsumed"
                  render={({ field: { value, onChange } }) => (
                    <NumberField
                      label="Fuel consumed (L)"
                      required
                      value={value}
                      onChangeText={onChange}
                      disabled={loading}
                      error={errors.fuelConsumed?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="fuelCost"
                  render={({ field: { value, onChange } }) => (
                    <CurrencyField
                      label="Fuel cost"
                      required
                      value={value}
                      onChangeText={onChange}
                      disabled={loading}
                      error={errors.fuelCost?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="revenue"
                  render={({ field: { value, onChange } }) => (
                    <CurrencyField
                      label="Revenue"
                      value={value}
                      onChangeText={onChange}
                      disabled={loading}
                      error={errors.revenue?.message}
                    />
                  )}
                />
              </>
            )}

            {errors.root?.message ? (
              <InlineAlert
                variant="error"
                title="Unable to complete"
                message={errors.root.message}
                style={styles.alert}
              />
            ) : null}

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                disabled={loading}
                style={styles.actionBtn}
              />
              <Button
                title="Complete trip"
                onPress={onSubmit}
                loading={loading}
                disabled={loading || !canComplete}
                style={styles.actionBtn}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function CancelTripModal({ visible, trip, loading, onClose, onConfirm }) {
  const canCancel =
    trip?.status === TRIP_STATUS.DRAFT ||
    trip?.status === TRIP_STATUS.DISPATCHED

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(tripCancellationSchema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (visible) {
      reset({ reason: '' })
      clearErrors()
    }
  }, [visible, reset, clearErrors])

  const onSubmit = handleSubmit(async (values) => {
    if (!canCancel || loading) return
    clearErrors('root')
    try {
      await onConfirm?.(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: getResourceErrorMessage(error, { notFound: 'Trip not found.' }),
      })
    }
  })

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalDialog}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle} allowFontScaling>
            Cancel trip
          </Text>
          <Text style={styles.modalMessage} allowFontScaling>
            Cancel {trip?.tripNumber || trip?.id}?
            {trip?.status === TRIP_STATUS.DISPATCHED
              ? ' The vehicle and driver will return to AVAILABLE.'
              : ''}
          </Text>

          {!canCancel ? (
            <InlineAlert
              variant="warning"
              title="Unavailable"
              message="Only draft or dispatched trips can be cancelled."
            />
          ) : (
            <Controller
              control={control}
              name="reason"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextAreaField
                  label="Cancellation reason"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  disabled={loading}
                  error={errors.reason?.message}
                />
              )}
            />
          )}

          {errors.root?.message ? (
            <InlineAlert
              variant="error"
              title="Unable to cancel"
              message={errors.root.message}
              style={styles.alert}
            />
          ) : null}

          <View style={styles.modalActions}>
            <Button
              title="Keep trip"
              variant="outline"
              onPress={onClose}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              title="Cancel trip"
              variant="danger"
              onPress={onSubmit}
              loading={loading}
              disabled={loading || !canCancel}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.TRIPS_VIEW,
  )
  const { hasPermission } = usePermissions()
  const tripQuery = useTrip(id, { enabled: allowed && Boolean(id) })
  const dispatchMutation = useDispatchTrip()
  const completeMutation = useCompleteTrip()
  const cancelMutation = useCancelTrip()

  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [actionError, setActionError] = useState(null)

  const trip = tripQuery.data?.data
  const isDraft = trip?.status === TRIP_STATUS.DRAFT
  const isDispatched = trip?.status === TRIP_STATUS.DISPATCHED

  const handleDispatch = async () => {
    if (!trip || dispatchMutation.isPending) return
    try {
      await dispatchMutation.mutateAsync(trip.id)
      toast.success('Trip dispatched')
      setDispatchOpen(false)
      setActionError(null)
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'Trip not found.' }),
      )
    }
  }

  const handleComplete = async (values) => {
    if (!trip || completeMutation.isPending) return
    await completeMutation.mutateAsync({ id: trip.id, payload: values })
    toast.success('Trip completed')
    setCompleteOpen(false)
    setActionError(null)
  }

  const handleCancel = async (values) => {
    if (!trip || cancelMutation.isPending) return
    await cancelMutation.mutateAsync({ id: trip.id, payload: values })
    toast.success('Trip cancelled')
    setCancelOpen(false)
    setActionError(null)
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (tripQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Trip details" onBack={() => router.back()} />
        <ScreenLoader message="Loading trip…" />
      </AppScreen>
    )
  }

  if (tripQuery.isError || !trip) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Trip details" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load trip"
          message={getResourceErrorMessage(tripQuery.error, {
            notFound: 'Trip not found.',
          })}
          onRetry={() => tripQuery.refetch()}
        />
      </AppScreen>
    )
  }

  const vehicle = trip.vehicle
  const driver = trip.driver

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={trip.tripNumber || trip.id}
        subtitle={`${trip.source} → ${trip.destination}`}
        onBack={() => router.replace(ROUTES.TRIPS)}
      />

      <View style={styles.actions}>
        {isDraft && hasPermission(PERMISSIONS.TRIPS_EDIT_DRAFT) ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.TRIP_EDIT, { id: trip.id }))
            }
            style={styles.actionBtn}
          />
        ) : null}
        {isDraft && hasPermission(PERMISSIONS.TRIPS_DISPATCH) ? (
          <Button
            title="Dispatch"
            onPress={() => {
              setActionError(null)
              setDispatchOpen(true)
            }}
            style={styles.actionBtn}
          />
        ) : null}
        {isDispatched && hasPermission(PERMISSIONS.TRIPS_COMPLETE) ? (
          <Button
            title="Complete"
            onPress={() => {
              setActionError(null)
              setCompleteOpen(true)
            }}
            style={styles.actionBtn}
          />
        ) : null}
        {(isDraft || isDispatched) &&
        hasPermission(PERMISSIONS.TRIPS_CANCEL) ? (
          <Button
            title="Cancel"
            variant="danger"
            onPress={() => {
              setActionError(null)
              setCancelOpen(true)
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

      <Card>
        <SectionTitle title="Trip details" />
        <DetailRow label="Trip number">
          <Text style={styles.valueText}>{trip.tripNumber || trip.id}</Text>
        </DetailRow>
        <DetailRow label="Route">
          <Text style={styles.valueText}>
            {trip.source} → {trip.destination}
          </Text>
        </DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={trip.status} />
        </DetailRow>
        <DetailRow label="Vehicle">
          <Text style={styles.valueText}>
            {vehicle
              ? `${vehicle.registrationNumber} · ${vehicle.vehicleName}`
              : trip.vehicleRegistration || trip.vehicleId || '—'}
          </Text>
        </DetailRow>
        <DetailRow label="Driver">
          <Text style={styles.valueText}>
            {driver?.name || trip.driverName || trip.driverId || '—'}
          </Text>
        </DetailRow>
        <DetailRow label="Cargo">
          <Text style={styles.valueText}>
            {formatWeight(trip.cargoWeight, 'kg')}
          </Text>
        </DetailRow>
        <DetailRow label="Capacity">
          <Text style={styles.valueText}>
            {formatWeight(
              trip.vehicleCapacity ?? vehicle?.maxLoadCapacity,
              'kg',
            )}
          </Text>
        </DetailRow>
        <DetailRow label="Planned distance">
          <Text style={styles.valueText}>
            {formatDistance(trip.plannedDistance, 'km')}
          </Text>
        </DetailRow>
        <DetailRow label="Start odometer">
          <Text style={styles.valueText}>
            {formatDistance(trip.startOdometer, 'km')}
          </Text>
        </DetailRow>
        <DetailRow label="Final odometer">
          <Text style={styles.valueText}>
            {formatDistance(trip.finalOdometer, 'km')}
          </Text>
        </DetailRow>
        <DetailRow label="Fuel consumed">
          <Text style={styles.valueText}>
            {formatFuel(trip.fuelConsumed)}
          </Text>
        </DetailRow>
        <DetailRow label="Fuel cost">
          <Text style={styles.valueText}>
            {formatCurrency(trip.fuelCost)}
          </Text>
        </DetailRow>
        <DetailRow label="Revenue">
          <Text style={styles.valueText}>{formatCurrency(trip.revenue)}</Text>
        </DetailRow>
        {trip.cancellationReason ? (
          <DetailRow label="Cancel reason">
            <Text style={styles.valueText}>{trip.cancellationReason}</Text>
          </DetailRow>
        ) : null}
        <DetailRow label="Created">
          <Text style={styles.valueText}>{formatDateTime(trip.createdAt)}</Text>
        </DetailRow>
        <DetailRow label="Dispatched">
          <Text style={styles.valueText}>
            {formatDateTime(trip.dispatchedAt)}
          </Text>
        </DetailRow>
        <DetailRow label="Completed">
          <Text style={styles.valueText}>
            {formatDateTime(trip.completedAt)}
          </Text>
        </DetailRow>
      </Card>

      <ConfirmModal
        visible={dispatchOpen}
        title="Dispatch trip"
        message={
          trip
            ? `Dispatch ${trip.tripNumber || trip.id}? The vehicle and driver will move to ON_TRIP.`
            : 'Dispatch this trip?'
        }
        confirmLabel="Dispatch"
        loading={dispatchMutation.isPending}
        onConfirm={handleDispatch}
        onCancel={() => {
          if (dispatchMutation.isPending) return
          setDispatchOpen(false)
        }}
      />

      <CompleteTripModal
        visible={completeOpen}
        trip={trip}
        loading={completeMutation.isPending}
        onClose={() => {
          if (completeMutation.isPending) return
          setCompleteOpen(false)
        }}
        onConfirm={handleComplete}
      />

      <CancelTripModal
        visible={cancelOpen}
        trip={trip}
        loading={cancelMutation.isPending}
        onClose={() => {
          if (cancelMutation.isPending) return
          setCancelOpen(false)
        }}
        onConfirm={handleCancel}
      />
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
    maxHeight: '90%',
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
