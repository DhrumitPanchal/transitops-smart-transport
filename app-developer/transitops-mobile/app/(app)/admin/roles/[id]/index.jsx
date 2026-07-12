/**
 * Expo-compatible detail route for /admin/roles/:id
 */
import React from 'react'
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
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useRole } from '@/hooks/roles'
import {
  PERMISSIONS,
} from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { ROLES, ROLE_DESCRIPTIONS } from '@/constants/roles'
import { buildPath, unwrapEntityResponse } from '@/utils/helpers'
import { formatDateTime, humanizeEnum } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography } from '@/theme'

function groupPermissions(permissions = []) {
  const groups = {}
  permissions.forEach((permission) => {
    const [module] = String(permission).split('.')
    if (!groups[module]) {
      groups[module] = []
    }
    groups[module].push(permission)
  })
  return Object.entries(groups).map(([key, items]) => ({
    key,
    label: humanizeEnum(key),
    items,
  }))
}

export default function AdminRoleDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.ROLES_VIEW,
  )
  const { hasPermission } = usePermissions()

  const roleQuery = useRole(id, { enabled: allowed && Boolean(id) })
  const role = unwrapEntityResponse(roleQuery.data, ['item', 'role'])

  const isSuperAdminRole =
    role?.key === ROLES.SUPER_ADMIN || role?.code === ROLES.SUPER_ADMIN
  const canEditPermissions = hasPermission(PERMISSIONS.ROLES_EDIT_PERMISSIONS)
  const permissionGroups = groupPermissions(role?.permissions || [])

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (roleQuery.isLoading) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Role details" onBack={() => router.back()} />
        <ScreenLoader message="Loading role…" />
      </AppScreen>
    )
  }

  if (roleQuery.isError || !role) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Role details" onBack={() => router.back()} />
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
        title={role.name}
        subtitle={
          role.description ||
          ROLE_DESCRIPTIONS[role.key] ||
          ROLE_DESCRIPTIONS[role.code] ||
          'Role template'
        }
        onBack={() => router.replace(ROUTES.ADMIN_ROLES)}
      />

      {canEditPermissions ? (
        <View style={styles.actions}>
          <Button
            title={isSuperAdminRole ? 'View permissions' : 'Edit permissions'}
            variant="secondary"
            onPress={() =>
              router.push(
                buildPath(ROUTES.ADMIN_ROLE_PERMISSIONS, { id: role.id }),
              )
            }
            style={styles.actionBtn}
          />
        </View>
      ) : null}

      <Card>
        <SectionTitle
          title="Role information"
          subtitle={
            isSuperAdminRole
              ? 'Super Admin permissions cannot be removed.'
              : `Updated ${formatDateTime(role.updatedAt) || '—'}`
          }
        />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel} allowFontScaling>
            Code
          </Text>
          <Text style={styles.infoValue} allowFontScaling>
            {role.key || role.code || '—'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel} allowFontScaling>
            Permissions
          </Text>
          <Text style={styles.infoValue} allowFontScaling>
            {(role.permissions || []).length}
          </Text>
        </View>
      </Card>

      <Card style={styles.permissionsCard}>
        <SectionTitle title="Assigned permissions" />
        {permissionGroups.length === 0 ? (
          <Text style={styles.emptyText} allowFontScaling>
            No permissions assigned to this role.
          </Text>
        ) : (
          permissionGroups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupTitle} allowFontScaling>
                {group.label}
              </Text>
              <View style={styles.permissionWrap}>
                {group.items.map((permission) => (
                  <View key={permission} style={styles.permissionChip}>
                    <Text style={styles.permissionText} allowFontScaling>
                      {permission}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
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
    minWidth: 160,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  permissionsCard: {
    marginTop: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  group: {
    marginTop: spacing.lg,
  },
  groupTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  permissionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
