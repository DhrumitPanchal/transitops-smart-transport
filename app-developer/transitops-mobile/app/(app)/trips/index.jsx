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
import { useTrips } from '@/hooks/trips'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { DEFAULT_PAGE_SIZE } from '@/constants/appConstants'
import { TRIP_STATUS_OPTIONS } from '@/constants/statuses'
import { buildPath } from '@/utils/helpers'
import { formatWeight } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'tripNumber', label: 'Trip number' },
  { value: 'status', label: 'Status' },
  { value: 'source', label: 'Source' },
  { value: 'destination', label: 'Destination' },
]

const INITIAL_FILTERS = {
  search: '',
  status: undefined,
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
  return params
}

export default function TripsIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.TRIPS_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.TRIPS_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const tripsQuery = useTrips(queryParams, { enabled: allowed })

  const rows = tripsQuery.data?.data || []
  const pagination = tripsQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Trips"
        subtitle="Dispatch & lifecycle"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.TRIPS_NEW)}
              accessibilityLabel="Create trip"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search trip, source, destination"
          style={styles.search}
        />
        <IconButton
          icon={Filter}
          onPress={() => setFilterOpen(true)}
          accessibilityLabel="Filter trips"
        />
        <IconButton
          icon={ArrowUpDown}
          onPress={() => setSortOpen(true)}
          accessibilityLabel="Sort trips"
        />
      </View>

      {tripsQuery.isLoading && !tripsQuery.data ? (
        <ScreenLoader message="Loading trips…" />
      ) : tripsQuery.isError ? (
        <ErrorState
          title="Unable to load trips"
          message={getResourceErrorMessage(tripsQuery.error, {
            notFound: 'Trips not found.',
          })}
          onRetry={() => tripsQuery.refetch()}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={tripsQuery.isRefetching && !tripsQuery.isLoading}
              onRefresh={() => tripsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No trips found"
              message="Try adjusting filters or create a draft trip."
              actionLabel={canCreate ? 'Create trip' : undefined}
              onAction={
                canCreate ? () => router.push(ROUTES.TRIPS_NEW) : undefined
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
              title={item.tripNumber || item.id}
              subtitle={`${item.source} → ${item.destination}`}
              meta={`${item.vehicleRegistration || item.vehicle?.registrationNumber || '—'} · ${item.driverName || item.driver?.name || '—'} · ${formatWeight(item.cargoWeight, 'kg')}`}
              right={<StatusBadge status={item.status} size="sm" />}
              onPress={() =>
                router.push(buildPath(ROUTES.TRIP_DETAIL, { id: item.id }))
              }
            />
          )}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        title="Filter trips"
        filters={[
          { id: 'status', label: 'Status', options: TRIP_STATUS_OPTIONS },
        ]}
        value={{ status: filters.status }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            status: draft.status,
            page: 1,
          }))
        }}
        onReset={() => {
          setFilters((prev) => ({
            ...prev,
            status: undefined,
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
