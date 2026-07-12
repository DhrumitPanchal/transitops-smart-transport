import React from 'react'
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Shield } from 'lucide-react-native'
import {
  AppScreen,
  ScreenHeader,
  ListCard,
  EmptyState,
  ErrorState,
  ScreenLoader,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { useRoles } from '@/hooks/roles'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { ROLE_DESCRIPTIONS } from '@/constants/roles'
import { buildPath, unwrapListResponse } from '@/utils/helpers'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography } from '@/theme'

export default function AdminRolesIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.ROLES_VIEW,
  )

  const rolesQuery = useRoles(
    { pageSize: 50, sortBy: 'name', sortDirection: 'asc' },
    { enabled: allowed },
  )

  const { rows } = unwrapListResponse(rolesQuery.data)

  const onRefresh = () => rolesQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Roles"
        subtitle="Permission templates"
      />

      {rolesQuery.isLoading && !rolesQuery.data ? (
        <ScreenLoader message="Loading roles…" />
      ) : rolesQuery.isError ? (
        <ErrorState
          title="Unable to load roles"
          message={getResourceErrorMessage(rolesQuery.error, {
            notFound: 'Roles not found.',
          })}
          onRetry={onRefresh}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={rolesQuery.isRefetching && !rolesQuery.isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No roles found"
              message="Role definitions are managed by the platform."
            />
          }
          renderItem={({ item }) => (
            <ListCard
              title={item.name}
              subtitle={
                item.description ||
                ROLE_DESCRIPTIONS[item.key] ||
                ROLE_DESCRIPTIONS[item.code] ||
                '—'
              }
              meta={`${(item.permissions || []).length} permissions`}
              left={
                <View style={styles.iconWrap}>
                  <Shield size={20} color={colors.primary} strokeWidth={2} />
                </View>
              }
              onPress={() =>
                router.push(buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: item.id }))
              }
              accessibilityHint="Opens role details"
            />
          )}
          ListFooterComponent={
            rows.length > 0 ? (
              <Text style={styles.footerHint} allowFontScaling>
                Tap a role to view permissions or edit access.
              </Text>
            ) : null
          }
        />
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  footerHint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
})
