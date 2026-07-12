/**
 * Expo-compatible detail route for /admin/users/:id
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
  RoleBadge,
  Card,
  SectionTitle,
  Button,
  SelectField,
  FormSection,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useAuth } from '@/hooks/auth/useAuth'
import {
  useUser,
  useChangeUserStatus,
  useApproveUser,
} from '@/hooks/users'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { ROLES, ROLE_OPTIONS } from '@/constants/roles'
import { USER_STATUS } from '@/constants/statuses'
import { buildPath, unwrapEntityResponse, getRoleLabel } from '@/utils/helpers'
import { formatDateTime, humanizeEnum } from '@/utils/formatters'
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

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.USERS_VIEW,
  )
  const { hasPermission } = usePermissions()

  const userQuery = useUser(id, { enabled: allowed && Boolean(id) })
  const changeStatusMutation = useChangeUserStatus()
  const approveMutation = useApproveUser()

  const [panel, setPanel] = useState(null)
  const [approveRole, setApproveRole] = useState('')
  const [actionError, setActionError] = useState(null)

  const user = unwrapEntityResponse(userQuery.data, ['item', 'user'])
  const isPending = user?.status === USER_STATUS.PENDING
  const isActive = user?.status === USER_STATUS.ACTIVE
  const isInactive = user?.status === USER_STATUS.INACTIVE

  const canEdit = hasPermission(PERMISSIONS.USERS_EDIT) && !isPending
  const canApprove =
    hasPermission(PERMISSIONS.USERS_APPROVE) && isPending
  const canChangeStatus = hasPermission(PERMISSIONS.USERS_CHANGE_STATUS)

  const handleApprove = async () => {
    if (!user || approveMutation.isPending || !approveRole) return
    setActionError(null)
    try {
      await approveMutation.mutateAsync({
        id: user.id,
        payload: { role: approveRole },
      })
      toast.success('User approved successfully')
      setPanel(null)
      setApproveRole('')
      userQuery.refetch()
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'User not found.' }),
      )
    }
  }

  const handleDeactivatePending = async () => {
    if (!user || changeStatusMutation.isPending) return
    setActionError(null)
    try {
      await changeStatusMutation.mutateAsync({
        id: user.id,
        status: USER_STATUS.INACTIVE,
      })
      toast.success('User deactivated')
      setPanel(null)
      userQuery.refetch()
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'User not found.' }),
      )
    }
  }

  const handleToggleStatus = async () => {
    if (!user || changeStatusMutation.isPending) return
    const nextStatus = isInactive ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE
    setActionError(null)
    try {
      await changeStatusMutation.mutateAsync({
        id: user.id,
        status: nextStatus,
      })
      toast.success(
        nextStatus === USER_STATUS.ACTIVE ? 'User activated' : 'User deactivated',
      )
      setPanel(null)
      userQuery.refetch()
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'User not found.' }),
      )
    }
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (userQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="User details" onBack={() => router.back()} />
        <ScreenLoader message="Loading user…" />
      </AppScreen>
    )
  }

  if (userQuery.isError || !user) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="User details" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load user"
          message={getResourceErrorMessage(userQuery.error, {
            notFound: 'User not found.',
          })}
          onRetry={() => userQuery.refetch()}
        />
      </AppScreen>
    )
  }

  const lockSelfDeactivate =
    String(user.id) === String(currentUser?.id) &&
    user.role === ROLES.SUPER_ADMIN

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={user.name}
        subtitle={user.email}
        onBack={() => router.replace(ROUTES.ADMIN_USERS)}
      />

      <View style={styles.actions}>
        {canEdit ? (
          <Button
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push(buildPath(ROUTES.ADMIN_USER_EDIT, { id: user.id }))
            }
            style={styles.actionBtn}
          />
        ) : null}
        {canApprove ? (
          <Button
            title="Approve"
            variant="primary"
            onPress={() => {
              setActionError(null)
              setApproveRole(user.role || '')
              setPanel('approve')
            }}
            style={styles.actionBtn}
          />
        ) : null}
        {canChangeStatus && isPending ? (
          <Button
            title="Deactivate"
            variant="danger"
            onPress={() => {
              setActionError(null)
              setPanel('deactivate')
            }}
            style={styles.actionBtn}
          />
        ) : null}
        {canChangeStatus && (isActive || isInactive) ? (
          <Button
            title={isInactive ? 'Activate' : 'Deactivate'}
            variant={isInactive ? 'primary' : 'danger'}
            disabled={lockSelfDeactivate && isActive}
            onPress={() => {
              setActionError(null)
              setPanel('status')
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

      {lockSelfDeactivate && isActive ? (
        <InlineAlert
          variant="warning"
          title="Super Admin account"
          message="You cannot deactivate your own Super Admin account."
          style={styles.alert}
        />
      ) : null}

      {panel === 'approve' ? (
        <FormSection
          title="Approve user"
          description="Assign a role to activate this pending account. Password is not changed."
        >
          <SelectField
            label="Role"
            required
            value={approveRole}
            onChange={setApproveRole}
            options={ROLE_OPTIONS}
            disabled={approveMutation.isPending}
          />
          <FormActions
            submitLabel="Confirm approve"
            cancelLabel="Dismiss"
            onSubmit={handleApprove}
            onCancel={() => setPanel(null)}
            loading={approveMutation.isPending}
            disabled={approveMutation.isPending || !approveRole}
            stacked
          />
        </FormSection>
      ) : null}

      {panel === 'deactivate' ? (
        <FormSection
          title="Deactivate pending user"
          description="Reject this registration without deleting the record."
        >
          <FormActions
            submitLabel="Confirm deactivate"
            cancelLabel="Dismiss"
            submitVariant="danger"
            onSubmit={handleDeactivatePending}
            onCancel={() => setPanel(null)}
            loading={changeStatusMutation.isPending}
            disabled={changeStatusMutation.isPending}
            stacked
          />
        </FormSection>
      ) : null}

      {panel === 'status' ? (
        <FormSection
          title={isInactive ? 'Activate user' : 'Deactivate user'}
          description={
            isInactive
              ? 'Restore access for this account.'
              : 'User will be unable to sign in while inactive.'
          }
        >
          <FormActions
            submitLabel={isInactive ? 'Confirm activate' : 'Confirm deactivate'}
            cancelLabel="Dismiss"
            submitVariant={isInactive ? 'primary' : 'danger'}
            onSubmit={handleToggleStatus}
            onCancel={() => setPanel(null)}
            loading={changeStatusMutation.isPending}
            disabled={changeStatusMutation.isPending}
            stacked
          />
        </FormSection>
      ) : null}

      <Card>
        <SectionTitle title="Profile" />
        <DetailRow label="Name">
          <Text style={styles.valueText}>{user.name}</Text>
        </DetailRow>
        <DetailRow label="Email">
          <Text style={styles.valueText}>{user.email}</Text>
        </DetailRow>
        <DetailRow label="Role">
          {user.role ? (
            <RoleBadge role={user.role} />
          ) : (
            <Text style={styles.valueText}>{getRoleLabel(user.role)}</Text>
          )}
        </DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={user.status} />
        </DetailRow>
        <DetailRow label="Created">
          <Text style={styles.valueText}>
            {formatDateTime(user.createdAt)}
          </Text>
        </DetailRow>
        <DetailRow label="Updated">
          <Text style={styles.valueText}>
            {formatDateTime(user.updatedAt)}
          </Text>
        </DetailRow>
      </Card>

      <Card style={styles.permissionsCard}>
        <SectionTitle
          title="Effective permissions"
          description="Resolved from the assigned role."
        />
        {(user.permissions || []).length === 0 ? (
          <Text style={styles.emptyPermissions} allowFontScaling>
            {isPending
              ? 'No permissions until this account is approved.'
              : 'No permissions on this user record.'}
          </Text>
        ) : (
          <View style={styles.permissionWrap}>
            {user.permissions.map((permission) => (
              <View key={permission} style={styles.permissionChip}>
                <Text style={styles.permissionText} allowFontScaling>
                  {humanizeEnum(permission.replace(/\./g, '_'))}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  alert: {
    marginBottom: spacing.lg,
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
  permissionsCard: {
    marginTop: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  emptyPermissions: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  permissionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  permissionChip: {
    backgroundColor: colors.grayMuted,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  permissionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
})
