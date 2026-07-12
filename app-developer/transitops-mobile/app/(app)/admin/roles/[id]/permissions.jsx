/**
 * Expo-compatible permissions route for /admin/roles/:id/permissions
 */
import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  Card,
  SectionTitle,
  CheckboxField,
  FormActions,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useRole, useUpdateRolePermissions } from '@/hooks/roles'
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
  stripSuperAdminOnlyPermissions,
  isSuperAdminOnlyPermission,
} from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants/roles'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import { humanizeEnum } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

function permissionLabel(permission) {
  const [, ...rest] = String(permission).split('.')
  return humanizeEnum(rest.join('_') || permission)
}

export default function AdminRolePermissionsScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.ROLES_EDIT_PERMISSIONS,
  )

  const roleQuery = useRole(id, { enabled: allowed && Boolean(id) })
  const updateMutation = useUpdateRolePermissions()
  const role = unwrapEntityResponse(roleQuery.data, ['item', 'role'])

  const isSuperAdminRole =
    role?.key === ROLES.SUPER_ADMIN || role?.code === ROLES.SUPER_ADMIN

  const initialSelected = useMemo(() => {
    if (!role) return []
    if (isSuperAdminRole) return [...ALL_PERMISSIONS]
    return (role.permissions || []).filter(
      (permission) => !isSuperAdminOnlyPermission(permission),
    )
  }, [role, isSuperAdminRole])

  const [selected, setSelected] = useState(initialSelected)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    setSelected(initialSelected)
  }, [initialSelected])

  const togglePermission = (permission) => {
    if (isSuperAdminRole) return
    if (
      !isSuperAdminRole &&
      isSuperAdminOnlyPermission(permission)
    ) {
      return
    }
    setSelected((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    )
  }

  const handleSave = async () => {
    if (!role || updateMutation.isPending || isSuperAdminRole) return
    setActionError(null)
    const toSave = isSuperAdminRole
      ? ALL_PERMISSIONS
      : stripSuperAdminOnlyPermissions(selected)

    try {
      await updateMutation.mutateAsync({
        id: role.id,
        permissions: toSave,
      })
      toast.success('Permissions saved')
      router.replace(buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: role.id }))
    } catch (error) {
      setActionError(
        getResourceErrorMessage(error, { notFound: 'Role not found.' }),
      )
    }
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (roleQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Role permissions" onBack={() => router.back()} />
        <ScreenLoader message="Loading role…" />
      </AppScreen>
    )
  }

  if (roleQuery.isError || !role) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Role permissions" onBack={() => router.back()} />
        <ErrorState
          title="Unable to load role"
          message={getResourceErrorMessage(roleQuery.error, {
            notFound: 'Role not found.',
          })}
          onRetry={() => roleQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen scroll edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={`${role.name} permissions`}
        subtitle={
          isSuperAdminRole
            ? 'Super Admin — all permissions locked'
            : 'Toggle module access for this role'
        }
        onBack={() =>
          router.replace(buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: role.id }))
        }
      />

      {isSuperAdminRole ? (
        <InlineAlert
          variant="info"
          title="Locked role"
          message="Super Admin always retains every permission. Editing is read-only."
          style={styles.alert}
        />
      ) : null}

      {actionError ? (
        <InlineAlert
          variant="error"
          title="Unable to save"
          message={actionError}
          style={styles.alert}
        />
      ) : null}

      <Card>
        <SectionTitle
          title="All permissions"
          subtitle={`${selected.length} of ${ALL_PERMISSIONS.length} selected`}
        />
        <View style={styles.checkboxList}>
          {ALL_PERMISSIONS.map((permission) => {
            const locked =
              isSuperAdminRole || isSuperAdminOnlyPermission(permission)
            const checked = isSuperAdminRole
              ? true
              : selected.includes(permission)

            return (
              <View key={permission} style={styles.checkboxItem}>
                <CheckboxField
                  label={permissionLabel(permission)}
                  helper={
                    isSuperAdminOnlyPermission(permission) && !isSuperAdminRole
                      ? `${permission} · Super Admin only`
                      : permission
                  }
                  value={checked}
                  onChange={() => togglePermission(permission)}
                  disabled={locked || updateMutation.isPending}
                  readOnly={isSuperAdminRole}
                />
              </View>
            )
          })}
        </View>
      </Card>

      {!isSuperAdminRole ? (
        <FormActions
          submitLabel="Save permissions"
          cancelLabel="Cancel"
          onSubmit={handleSave}
          onCancel={() =>
            router.replace(buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: role.id }))
          }
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          stacked
        />
      ) : null}

      {!isSuperAdminRole && SUPER_ADMIN_ONLY_PERMISSIONS.length > 0 ? (
        <InlineAlert
          variant="warning"
          title="Reserved permissions"
          message="Users and roles permissions cannot be granted to non–Super Admin roles."
          style={styles.footerAlert}
        />
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  alert: {
    marginBottom: spacing.lg,
  },
  footerAlert: {
    marginTop: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  checkboxList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  checkboxItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
})
