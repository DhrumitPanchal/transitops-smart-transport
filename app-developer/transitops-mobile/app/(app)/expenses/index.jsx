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
import { useExpenses } from '@/hooks/expenses'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import {
  DEFAULT_PAGE_SIZE,
  EXPENSE_TYPE_OPTIONS,
  EXPENSE_TYPE_LABELS,
} from '@/constants/appConstants'
import { buildPath, unwrapListResponse } from '@/utils/helpers'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { colors, spacing } from '@/theme'

const SORT_OPTIONS = [
  { value: 'expenseDate', label: 'Expense date' },
  { value: 'amount', label: 'Amount' },
  { value: 'expenseType', label: 'Type' },
  { value: 'createdAt', label: 'Created' },
]

const INITIAL_FILTERS = {
  expenseType: undefined,
  sortBy: 'expenseDate',
  sortDirection: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters, search) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'expenseDate',
    sortDirection: filters.sortDirection || 'desc',
  }
  if (search?.trim()) params.search = search.trim()
  if (filters.expenseType) params.expenseType = filters.expenseType
  return params
}

export default function ExpensesIndexScreen() {
  const router = useRouter()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.EXPENSES_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission(PERMISSIONS.EXPENSES_CREATE)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const queryParams = useMemo(
    () => cleanParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  )
  const listQuery = useExpenses(queryParams, { enabled: allowed })

  const { rows, pagination } = unwrapListResponse(listQuery.data, {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  })

  const activeFilterCount = [filters.expenseType].filter(Boolean).length

  const onRefresh = () => listQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  return (
    <AppScreen padded={false} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Expenses"
        subtitle="Operational costs"
        right={
          canCreate ? (
            <IconButton
              icon={Plus}
              onPress={() => router.push(ROUTES.EXPENSES_NEW)}
              accessibilityLabel="Create expense"
            />
          ) : null
        }
      />

      <View style={styles.toolbar}>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search description, vehicle, trip"
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
          accessibilityLabel="Sort expenses"
        />
      </View>

      {listQuery.isLoading && !listQuery.data ? (
        <ScreenLoader message="Loading expenses…" />
      ) : listQuery.isError ? (
        <ErrorState
          title="Unable to load expenses"
          message={getResourceErrorMessage(listQuery.error, {
            notFound: 'Expenses not found.',
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
              title="No expenses"
              message="Try adjusting filters or record a new expense."
              actionLabel={canCreate ? 'Create expense' : undefined}
              onAction={
                canCreate ? () => router.push(ROUTES.EXPENSES_NEW) : undefined
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
                EXPENSE_TYPE_LABELS[item.expenseType] || item.expenseType
              }
              subtitle={item.description || '—'}
              meta={`${formatDate(item.expenseDate)} · ${formatCurrency(item.amount)} · ${
                item.vehicleRegistration ||
                item.vehicle?.registrationNumber ||
                'No vehicle'
              }`}
              onPress={() =>
                router.push(
                  buildPath(ROUTES.EXPENSE_DETAIL, { id: item.id }),
                )
              }
              accessibilityHint="Opens expense details"
            />
          )}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        title="Filter expenses"
        filters={[
          {
            id: 'expenseType',
            label: 'Type',
            options: EXPENSE_TYPE_OPTIONS,
          },
        ]}
        value={{
          expenseType: filters.expenseType,
        }}
        onApply={(draft) => {
          setFilters((prev) => ({
            ...prev,
            expenseType: draft.expenseType,
            page: 1,
          }))
        }}
        onReset={() => {
          setFilters((prev) => ({
            ...prev,
            expenseType: undefined,
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
            sortBy: draft.sortBy || 'expenseDate',
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
