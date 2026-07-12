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
import { useMaintenanceList } from '@/hooks/maintenance'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import {
  DEFAULT_PAGE_SIZE,
  MAINTENANCE_TYPE_OPTIONS,
  MAINTENANCE_TYPE_LABELS,
} from '@/constants/appConstants'
import { MAINTENANCE_STATUS_OPTIONS } from '@/constants/statuses'
import { buildPath, unwrapListResponse } from '@/utils/helpers'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'startDate', label: 'Start date' },
  { value: 'expectedEndDate', label: 'Expected end' },
  { value: 'status', label: 'Status' },
  { value: 'cost', label: 'Cost' },
]

const INITIAL_FILTERS = {
  status: undefined,
  maintenanceType: undefined,
  sortBy: 'createdAt',
  sortDirection: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters, search) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'createdAt',
    sortDirection: filters.sortDirection || 'desc',
  }
  if (search?.trim()) params.search = search.trim()
  if (filters.status) params.status = filters.status
  if (filters.maintenanceType) params.maintenanceType = filters.maintenanceType
  return params
}

export default function MaintenanceIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.MAINTENANCE_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.MAINTENANCE_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const listQuery = useMaintenanceList(queryParams, { enabled: allowed })

  const { rows, pagination } = unwrapListResponse(listQuery.data, {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  })

  const activeFilterCount = [filters.status, filters.maintenanceType].filter(
    Boolean,
  ).length

  const onRefresh = () => listQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Maintenance"
        subtitle="Workshop work orders"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.MAINTENANCE_NEW)}
              accessibilityLabel="Create maintenance"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search vehicle, vendor, description"
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
          accessibilityLabel="Sort maintenance"
        />
      </View>

      {listQuery.isLoading && !listQuery.data ? (
        <ScreenLoader message="Loading maintenance…" />
      ) : listQuery.isError ? (
        <ErrorState
          title="Unable to load maintenance"
          message={getResourceErrorMessage(listQuery.error, {
            notFound: 'Maintenance records not found.',
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
              refreshing={listQuery.isRefetching && !listQuery.isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No maintenance records"
              message="Try adjusting filters or schedule new maintenance."
              actionLabel={canCreate ? 'Create maintenance' : undefined}
              onAction={
                canCreate
                  ? () => router.push(ROUTES.MAINTENANCE_NEW)
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
              title={
                item.vehicleRegistration ||
                item.vehicle?.registrationNumber ||
                'Vehicle'
              }
              subtitle={`${MAINTENANCE_TYPE_LABELS[item.maintenanceType] || item.maintenanceType} · ${item.description || '—'}`}
              meta={`Expected ${formatDate(item.expectedEndDate)} · ${formatCurrency(item.finalCost ?? item.cost)}`}
              right={<StatusBadge status={item.status} size="sm" />}
              onPress={() =>
                router.push(
                  buildPath(ROUTES.MAINTENANCE_DETAIL, { id: item.id }),
                )
              }
              accessibilityHint="Opens maintenance details"
            />
          )}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        title="Filter maintenance"
        filters={[
          {
            id: 'status',
            label: 'Status',
            options: MAINTENANCE_STATUS_OPTIONS,
          },
          {
            id: 'maintenanceType',
            label: 'Type',
            options: MAINTENANCE_TYPE_OPTIONS,
          },
        ]}
        value={{
          status: filters.status,
          maintenanceType: filters.maintenanceType,
        }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            status: draft.status,
            maintenanceType: draft.maintenanceType,
            page: 1,
          }))
        }}
        onReset={() => {
          setFilters((prev) => ({
            ...prev,
            status: undefined,
            maintenanceType: undefined,
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
            sortBy: draft.sortBy || 'createdAt',
            sortDirection: draft.sortDirection || 'desc',
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
