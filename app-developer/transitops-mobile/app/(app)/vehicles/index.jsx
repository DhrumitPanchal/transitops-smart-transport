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
import { useVehicles } from '@/hooks/vehicles'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import {
  DEFAULT_PAGE_SIZE,
  VEHICLE_TYPE_OPTIONS,
  VEHICLE_TYPE_LABELS,
} from '@/constants/appConstants'
import { VEHICLE_STATUS_OPTIONS } from '@/constants/statuses'
import { buildPath } from '@/utils/helpers'
import { formatWeight } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

const REGION_OPTIONS = [
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Mysuru', label: 'Mysuru' },
  { value: 'Hubballi', label: 'Hubballi' },
  { value: 'Mangaluru', label: 'Mangaluru' },
  { value: 'Chennai', label: 'Chennai' },
]

const SORT_OPTIONS = [
  { value: 'registrationNumber', label: 'Registration' },
  { value: 'vehicleName', label: 'Name' },
  { value: 'vehicleType', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'region', label: 'Region' },
  { value: 'createdAt', label: 'Created' },
]

const INITIAL_FILTERS = {
  search: '',
  vehicleType: undefined,
  status: undefined,
  region: undefined,
  sortBy: 'registrationNumber',
  sortDirection: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters, search) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'registrationNumber',
    sortDirection: filters.sortDirection || 'asc',
  }
  if (search?.trim()) params.search = search.trim()
  if (filters.vehicleType) params.vehicleType = filters.vehicleType
  if (filters.status) params.status = filters.status
  if (filters.region) params.region = filters.region
  return params
}

export default function VehiclesIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.VEHICLES_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.VEHICLES_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const vehiclesQuery = useVehicles(queryParams, { enabled: allowed })

  const rows = vehiclesQuery.data?.data || []
  const pagination = vehiclesQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  const activeFilterCount = [
    filters.vehicleType,
    filters.status,
    filters.region,
  ].filter(Boolean).length

  const onRefresh = () => vehiclesQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Vehicles"
        subtitle="Fleet registry"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.VEHICLES_NEW)}
              accessibilityLabel="Add vehicle"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search registration, name, model"
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
          accessibilityLabel="Sort vehicles"
        />
      </View>

      {vehiclesQuery.isLoading && !vehiclesQuery.data ? (
        <ScreenLoader message="Loading vehicles…" />
      ) : vehiclesQuery.isError ? (
        <ErrorState
          title="Unable to load vehicles"
          message={getResourceErrorMessage(vehiclesQuery.error, {
            notFound: 'Vehicles not found.',
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
              refreshing={vehiclesQuery.isRefetching && !vehiclesQuery.isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No vehicles found"
              message="Try adjusting filters or add a new vehicle."
              actionLabel={canCreate ? 'Add vehicle' : undefined}
              onAction={
                canCreate ? () => router.push(ROUTES.VEHICLES_NEW) : undefined
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
              title={item.registrationNumber}
              subtitle={item.vehicleName}
              meta={`${VEHICLE_TYPE_LABELS[item.vehicleType] || item.vehicleType} · ${item.region || '—'} · ${formatWeight(item.maxLoadCapacity, 'kg')}`}
              right={<StatusBadge status={item.status} size="sm" />}
              onPress={() =>
                router.push(buildPath(ROUTES.VEHICLE_DETAIL, { id: item.id }))
              }
              accessibilityHint="Opens vehicle details"
            />
          )}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        title="Filter vehicles"
        filters={[
          {
            id: 'vehicleType',
            label: 'Type',
            options: VEHICLE_TYPE_OPTIONS,
          },
          {
            id: 'status',
            label: 'Status',
            options: VEHICLE_STATUS_OPTIONS,
          },
          {
            id: 'region',
            label: 'Region',
            options: REGION_OPTIONS,
          },
        ]}
        value={{
          vehicleType: filters.vehicleType,
          status: filters.status,
          region: filters.region,
        }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            vehicleType: draft.vehicleType,
            status: draft.status,
            region: draft.region,
            page: 1,
          }))
        }}
        onReset={() => {
          setFilters((prev) => ({
            ...prev,
            vehicleType: undefined,
            status: undefined,
            region: undefined,
            page: 1,
          }))
        }}
        onClose={() => setFilterOpen(false)}
      />

      <FilterSheet
        visible={sortOpen}
        title="Sort by"
        filters={[
          {
            id: 'sortBy',
            label: 'Field',
            options: SORT_OPTIONS,
          },
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
            sortBy: draft.sortBy || 'registrationNumber',
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
