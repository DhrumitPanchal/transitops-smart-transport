import React, { useMemo, useState } from 'react'
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import {
  AppScreen,
  ScreenHeader,
  SearchBar,
  ListCard,
  StatusBadge,
  RoleBadge,
  EmptyState,
  ErrorState,
  ScreenLoader,
  PaginationControls,
  IconButton,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useUsers } from '@/hooks/users'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { DEFAULT_PAGE_SIZE } from '@/constants/appConstants'
import { USER_STATUS, STATUS_LABELS } from '@/constants/statuses'
import { buildPath, unwrapListResponse, getRoleLabel } from '@/utils/helpers'
import { formatDateTime } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing, typography, radius } from '@/theme'

const STATUS_TABS = [
  { value: undefined, label: 'All' },
  { value: USER_STATUS.PENDING, label: STATUS_LABELS[USER_STATUS.PENDING] },
  { value: USER_STATUS.ACTIVE, label: STATUS_LABELS[USER_STATUS.ACTIVE] },
  { value: USER_STATUS.INACTIVE, label: STATUS_LABELS[USER_STATUS.INACTIVE] },
]

const INITIAL_FILTERS = {
  status: undefined,
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters, search) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'name',
    sortDirection: filters.sortDirection || 'asc',
  }
  if (search?.trim()) params.search = search.trim()
  if (filters.status) params.status = filters.status
  return params
}

export default function AdminUsersIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.USERS_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.USERS_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const usersQuery = useUsers(queryParams, { enabled: allowed })

  const { rows, pagination } = unwrapListResponse(usersQuery.data, {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  })

  const onRefresh = () => usersQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Users"
        subtitle="Super Admin · access control"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.ADMIN_USERS_NEW)}
              accessibilityLabel="Add user"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search name or email"
          style={styles.search}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {STATUS_TABS.map((tab) => {
          const active = filters.status === tab.value
          return (
            <Pressable
              key={tab.label}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: tab.value,
                  page: 1,
                }))
              }
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter ${tab.label}`}
            >
              <Text
                style={[styles.chipText, active && styles.chipTextActive]}
                allowFontScaling
              >
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {usersQuery.isLoading && !usersQuery.data ? (
        <ScreenLoader message="Loading users…" />
      ) : usersQuery.isError ? (
        <ErrorState
          title="Unable to load users"
          message={getResourceErrorMessage(usersQuery.error, {
            notFound: 'Users not found.',
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
              refreshing={usersQuery.isRefetching && !usersQuery.isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No users found"
              message="Try adjusting filters or create a new user."
              actionLabel={canCreate ? 'Add user' : undefined}
              onAction={
                canCreate
                  ? () => router.push(ROUTES.ADMIN_USERS_NEW)
                  : undefined
              }
            />
          }
          ListFooterComponent={
            rows.length > 0 ? (
              <PaginationControls
                page={pagination.page || filters.page}
                pageSize={pagination.pageSize || filters.pageSize}
                total={pagination.totalItems || 0}
                onPageChange={(page) =>
                  setFilters((prev) => ({ ...prev, page }))
                }
              />
            ) : null
          }
          renderItem={({ item }) => (
            <ListCard
              title={item.name}
              subtitle={item.email}
              meta={`${getRoleLabel(item.role)} · ${formatDateTime(item.updatedAt)}`}
              right={
                <View style={styles.badges}>
                  {item.role ? (
                    <RoleBadge role={item.role} size="sm" />
                  ) : null}
                  <StatusBadge status={item.status} size="sm" />
                </View>
              }
              onPress={() =>
                router.push(buildPath(ROUTES.ADMIN_USER_DETAIL, { id: item.id }))
              }
              accessibilityHint="Opens user details"
            />
          )}
        />
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  search: {
    flex: 1,
  },
  chips: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  badges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
})
