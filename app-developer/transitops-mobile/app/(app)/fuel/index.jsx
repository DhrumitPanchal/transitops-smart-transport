import React, { useMemo, useState } from 'react'
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Filter, Plus, ArrowUpDown } from 'lucide-react-native'
import {
  AppScreen,
  ScreenHeader,
  SearchBar,
  ListCard,
  EmptyState,
  ErrorState,
  ScreenLoader,
  PaginationControls,
  FilterSheet,
  IconButton,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useFuelLogs } from '@/hooks/fuel'
import { useVehicles } from '@/hooks/vehicles'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { DEFAULT_PAGE_SIZE } from '@/constants/appConstants'
import { buildPath, unwrapListResponse } from '@/utils/helpers'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

const SORT_OPTIONS = [
  { value: 'fuelDate', label: 'Fuel date' },
  { value: 'cost', label: 'Cost' },
  { value: 'liters', label: 'Litres' },
  { value: 'createdAt', label: 'Created' },
]

const INITIAL_FILTERS = {
  vehicleId: undefined,
  sortBy: 'fuelDate',
  sortDirection: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters, search) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'fuelDate',
    sortDirection: filters.sortDirection || 'desc',
  }
  if (search?.trim()) params.search = search.trim()
  if (filters.vehicleId) params.vehicleId = filters.vehicleId
  return params
}

function getCostPerLitre(item) {
  if (item.costPerLitre != null) return item.costPerLitre
  const liters = Number(item.liters)
  const cost = Number(item.cost)
  if (!Number.isFinite(liters) || liters <= 0 || !Number.isFinite(cost)) {
    return null
  }
  return Math.round((cost / liters) * 100) / 100
}

export default function FuelIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.FUEL_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.FUEL_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const listQuery = useFuelLogs(queryParams, { enabled: allowed })
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )

  const { rows, pagination } = unwrapListResponse(listQuery.data, {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  })
  const { rows: vehicles } = unwrapListResponse(vehiclesQuery.data)

  const vehicleFilterOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      })),
    [vehicles],
  )

  const activeFilterCount = [filters.vehicleId].filter(Boolean).length

  const onRefresh = () => listQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Fuel"
        subtitle="Fuel purchase logs"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.FUEL_NEW)}
              accessibilityLabel="Create fuel log"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search vehicle, station, notes"
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
          accessibilityLabel="Sort fuel logs"
        />
      </View>

      {listQuery.isLoading && !listQuery.data ? (
        <ScreenLoader message="Loading fuel logs…" />
      ) : listQuery.isError ? (
        <ErrorState
          title="Unable to load fuel logs"
          message={getResourceErrorMessage(listQuery.error, {
            notFound: 'Fuel logs not found.',
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
              title="No fuel logs"
              message="Try adjusting filters or record a new fuel purchase."
              actionLabel={canCreate ? 'Create fuel log' : undefined}
              onAction={
                canCreate ? () => router.push(ROUTES.FUEL_NEW) : undefined
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
          renderItem={({ item }) => {
            const costPerLitre = getCostPerLitre(item)
            return (
              <ListCard
                title={
                  item.vehicleRegistration ||
                  item.vehicle?.registrationNumber ||
                  'Vehicle'
                }
                subtitle={
                  item.stationName ||
                  (item.tripNumber
                    ? `Trip ${item.tripNumber}`
                    : item.trip?.tripNumber
                      ? `Trip ${item.trip.tripNumber}`
                      : '—')
                }
                meta={`${formatDate(item.fuelDate)} · ${formatCurrency(item.cost)} · ${item.liters} L${
                  costPerLitre != null
                    ? ` · ${formatCurrency(costPerLitre)}/L`
                    : ''
                }`}
                onPress={() =>
                  router.push(buildPath(ROUTES.FUEL_DETAIL, { id: item.id }))
                }
                accessibilityHint="Opens fuel log details"
              />
            )
          }}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        title="Filter fuel logs"
        filters={[
          {
            id: 'vehicleId',
            label: 'Vehicle',
            options: vehicleFilterOptions,
          },
        ]}
        value={{
          vehicleId: filters.vehicleId,
        }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            vehicleId: draft.vehicleId,
            page: 1,
          }))
        }}
        onReset={() => {
          setFilters((prev) => ({
            ...prev,
            vehicleId: undefined,
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
            sortBy: draft.sortBy || 'fuelDate',
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
