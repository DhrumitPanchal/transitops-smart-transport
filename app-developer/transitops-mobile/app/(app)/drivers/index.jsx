import React, { useMemo, useState } from 'react'
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Filter, Plus, ArrowUpDown } from 'lucide-react-native'
import {
  AppScreen,
  ScreenHeader,
  SearchBar,
  ListCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  ScreenLoader,
  PaginationControls,
  FilterSheet,
  IconButton,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useDrivers } from '@/hooks/drivers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import {
  DEFAULT_PAGE_SIZE,
  LICENCE_CATEGORY_OPTIONS,
  LICENCE_CATEGORY_LABELS,
} from '@/constants/appConstants'
import { DRIVER_STATUS_OPTIONS } from '@/constants/statuses'
import { buildPath } from '@/utils/helpers'
import { formatDate } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

const LICENSE_CONDITION_OPTIONS = [
  { value: 'VALID', label: 'Valid' },
  { value: 'EXPIRING_SOON', label: 'Expiring soon' },
  { value: 'EXPIRED', label: 'Expired' },
]

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'licenseNumber', label: 'Licence number' },
  { value: 'licenseExpiryDate', label: 'Licence expiry' },
  { value: 'safetyScore', label: 'Safety score' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created' },
]

const INITIAL_FILTERS = {
  search: '',
  status: undefined,
  licenseCategory: undefined,
  licenseCondition: undefined,
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
  if (filters.licenseCategory) params.licenseCategory = filters.licenseCategory
  if (filters.licenseCondition) params.licenseCondition = filters.licenseCondition
  return params
}

export default function DriversIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.DRIVERS_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.DRIVERS_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const driversQuery = useDrivers(queryParams, { enabled: allowed })

  const rows = driversQuery.data?.data || []
  const pagination = driversQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  const activeFilterCount = [
    filters.status,
    filters.licenseCategory,
    filters.licenseCondition,
  ].filter(Boolean).length

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Drivers"
        subtitle="Compliance & availability"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.DRIVERS_NEW)}
              accessibilityLabel="Add driver"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search name, licence, or contact"
          style={styles.search}
        />
        <IconButton
          icon={Filter}
          onPress={() => setFilterOpen(true)}
          accessibilityLabel={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
        />
        <IconButton
          icon={ArrowUpDown}
          onPress={() => setSortOpen(true)}
          accessibilityLabel="Sort drivers"
        />
      </View>

      {driversQuery.isLoading && !driversQuery.data ? (
        <ScreenLoader message="Loading drivers…" />
      ) : driversQuery.isError ? (
        <ErrorState
          title="Unable to load drivers"
          message={getResourceErrorMessage(driversQuery.error, {
            notFound: 'Drivers not found.',
          })}
          onRetry={() => driversQuery.refetch()}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={driversQuery.isRefetching && !driversQuery.isLoading}
              onRefresh={() => driversQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No drivers found"
              message="Try adjusting filters or add a new driver."
              actionLabel={canCreate ? 'Add driver' : undefined}
              onAction={
                canCreate ? () => router.push(ROUTES.DRIVERS_NEW) : undefined
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
              subtitle={item.licenseNumber}
              meta={`${LICENCE_CATEGORY_LABELS[item.licenseCategory] || item.licenseCategory} · Exp ${formatDate(item.licenseExpiryDate)} · Score ${item.safetyScore ?? '—'}`}
              right={<StatusBadge status={item.status} size="sm" />}
              onPress={() =>
                router.push(buildPath(ROUTES.DRIVER_DETAIL, { id: item.id }))
              }
            />
          )}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        title="Filter drivers"
        filters={[
          { id: 'status', label: 'Status', options: DRIVER_STATUS_OPTIONS },
          {
            id: 'licenseCategory',
            label: 'Licence category',
            options: LICENCE_CATEGORY_OPTIONS,
          },
          {
            id: 'licenseCondition',
            label: 'Licence validity',
            options: LICENSE_CONDITION_OPTIONS,
          },
        ]}
        value={{
          status: filters.status,
          licenseCategory: filters.licenseCategory,
          licenseCondition: filters.licenseCondition,
        }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            status: draft.status,
            licenseCategory: draft.licenseCategory,
            licenseCondition: draft.licenseCondition,
            page: 1,
          }))
        }}
        onReset={() => {
          setFilters((prev) => ({
            ...prev,
            status: undefined,
            licenseCategory: undefined,
            licenseCondition: undefined,
            page: 1,
          }))
        }}
        onClose={() => setFilterOpen(false)}
      />

      <FilterSheet
        visible={sortOpen}
        title="Sort by"
        filters={[
          { id: 'sortBy', label: 'Field', options: SORT_OPTIONS },
          {
            id: 'sortDirection',
            label: 'Direction',
            options: [
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' },
            ],
          },
        ]}
        value={{
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
        }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            sortBy: draft.sortBy || 'name',
            sortDirection: draft.sortDirection || 'asc',
            page: 1,
          }))
        }}
        onClose={() => setSortOpen(false)}
      />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  search: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
})
