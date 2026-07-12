import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native'
import {
  Download,
  Fuel,
  Gauge,
  IndianRupee,
  Truck,
  Wrench,
} from 'lucide-react-native'
import {
  AppScreen,
  ScreenHeader,
  ScreenLoader,
  ErrorState,
  EmptyState,
  Card,
  SectionTitle,
  KpiCard,
  SimpleBarChart,
  Button,
  IconButton,
  DateField,
  SelectField,
  SearchableSelectField,
  FormSection,
  InlineAlert,
  toast,
} from '@/components'
import { useRequirePermission } from '@/hooks/auth/useRequirePermission'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { useReportSummary, useExportReportCsv } from '@/hooks/reports'
import { useVehicles } from '@/hooks/vehicles'
import { PERMISSIONS } from '@/constants/permissions'
import { VEHICLE_TYPE_OPTIONS } from '@/constants/appConstants'
import { unwrapEntityResponse, unwrapListResponse } from '@/utils/helpers'
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercentage,
} from '@/utils/formatters'
import { getResourceErrorMessage } from '@/utils/formHelpers'
import { shareCsvString } from '@/utils/csvExport'
import { colors, spacing, typography } from '@/theme'

const REGION_OPTIONS = [
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Mysuru', label: 'Mysuru' },
  { value: 'Hubballi', label: 'Hubballi' },
  { value: 'Mangaluru', label: 'Mangaluru' },
  { value: 'Chennai', label: 'Chennai' },
]

const INITIAL_FILTERS = {
  dateFrom: '',
  dateTo: '',
  vehicleId: '',
  vehicleType: '',
  region: '',
}

function cleanParams(filters) {
  const params = {}
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.vehicleId) params.vehicleId = filters.vehicleId
  if (filters.vehicleType) params.vehicleType = filters.vehicleType
  if (filters.region) params.region = filters.region
  return params
}

function FormulaRow({ label, formula }) {
  return (
    <View style={styles.formulaRow}>
      <Text style={styles.formulaLabel} allowFontScaling>
        {label}
      </Text>
      <Text style={styles.formulaText} allowFontScaling>
        {formula}
      </Text>
    </View>
  )
}

export default function ReportsIndexScreen() {
  const { width } = useWindowDimensions()
  const { allowed, isLoading: authLoading } = useRequirePermission(
    PERMISSIONS.REPORTS_VIEW,
  )
  const { hasPermission } = usePermissions()
  const canExport = hasPermission(PERMISSIONS.REPORTS_EXPORT)

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const queryParams = useMemo(() => cleanParams(filters), [filters])

  const reportQuery = useReportSummary(queryParams, { enabled: allowed })
  const exportMutation = useExportReportCsv()
  const vehiclesQuery = useVehicles(
    { pageSize: 100, sortBy: 'registrationNumber', sortDirection: 'asc' },
    { enabled: allowed },
  )

  const summary =
    unwrapEntityResponse(reportQuery.data, ['item']) || reportQuery.data?.data
  const metrics = summary?.metrics || {}
  const costs = summary?.costs || {}
  const vehicles = summary?.vehicles || {}

  const { rows: vehicleRows } = unwrapListResponse(vehiclesQuery.data)
  const vehicleOptions = useMemo(
    () =>
      vehicleRows.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
      })),
    [vehicleRows],
  )

  const kpiColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1
  const hasCostData =
    Number(costs.fuel || metrics.fuelCost || 0) > 0 ||
    Number(costs.maintenance || metrics.maintenanceCost || 0) > 0 ||
    Number(costs.expenses || metrics.otherExpenses || 0) > 0
  const hasFleetStatus =
    Number(vehicles.total || 0) > 0 ||
    Number(vehicles.available || 0) > 0 ||
    Number(vehicles.onTrip || 0) > 0

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleExport = async () => {
    if (exportMutation.isPending) return
    try {
      const payload = await exportMutation.mutateAsync(queryParams)
      await shareCsvString(
        payload.content,
        payload.fileName || `transitops-report-${Date.now()}.csv`,
      )
      toast.success('Report exported')
    } catch (error) {
      toast.error(
        getResourceErrorMessage(error, {
          notFound: 'Report export failed.',
        }),
      )
    }
  }

  const onRefresh = () => reportQuery.refetch()

  if (authLoading || !allowed) {
    return <ScreenLoader message="Checking access…" />
  }

  if (reportQuery.isLoading && !reportQuery.data) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Reports" subtitle="Operational analytics" />
        <ScreenLoader message="Loading reports…" />
      </AppScreen>
    )
  }

  if (reportQuery.isError || !summary) {
    return (
      <AppScreen edges={['top', 'left', 'right']}>
        <ScreenHeader title="Reports" subtitle="Operational analytics" />
        <ErrorState
          title="Unable to load reports"
          message={getResourceErrorMessage(reportQuery.error, {
            notFound: 'Report summary not found.',
          })}
          onRetry={onRefresh}
        />
      </AppScreen>
    )
  }

  const isEmptySummary =
    !metrics.fuelEfficiency &&
    !metrics.fleetUtilization &&
    !metrics.revenue &&
    !metrics.operationalCost &&
    !vehicles.total

  return (
    <AppScreen
      scroll
      edges={['top', 'left', 'right']}
      refreshControl={
        <RefreshControl
          refreshing={reportQuery.isRefetching && !reportQuery.isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <ScreenHeader
        title="Reports"
        subtitle={
          summary.generatedAt
            ? `Generated ${formatDateTime(summary.generatedAt)}`
            : 'Operational analytics'
        }
        right={
          canExport ? (
            <IconButton
              icon={Download}
              onPress={handleExport}
              disabled={exportMutation.isPending}
              accessibilityLabel="Export report CSV"
            />
          ) : null
        }
      />

      {reportQuery.isStale ? (
        <InlineAlert
          variant="warning"
          title="Data may be outdated"
          message="Live events mark reports stale. Pull to refresh or adjust filters."
          style={styles.alert}
        />
      ) : null}

      <FormSection
        title="Filters"
        description="Narrow analytics by date, vehicle, type, or region."
      >
        <DateField
          label="Date from"
          value={filters.dateFrom}
          onChange={(value) => updateFilter('dateFrom', value)}
        />
        <DateField
          label="Date to"
          value={filters.dateTo}
          onChange={(value) => updateFilter('dateTo', value)}
        />
        <SearchableSelectField
          label="Vehicle"
          value={filters.vehicleId}
          onChange={(value) => updateFilter('vehicleId', value)}
          options={vehicleOptions}
          placeholder="All vehicles"
          disabled={vehiclesQuery.isLoading}
        />
        <SelectField
          label="Vehicle type"
          value={filters.vehicleType}
          onChange={(value) => updateFilter('vehicleType', value)}
          options={VEHICLE_TYPE_OPTIONS}
          placeholder="All types"
        />
        <SelectField
          label="Region"
          value={filters.region}
          onChange={(value) => updateFilter('region', value)}
          options={REGION_OPTIONS}
          placeholder="All regions"
        />
        <Button
          title="Reset filters"
          variant="outline"
          onPress={() => setFilters(INITIAL_FILTERS)}
          style={styles.resetBtn}
        />
      </FormSection>

      {isEmptySummary ? (
        <EmptyState
          title="No report data"
          message="Try widening the date range or clearing filters."
        />
      ) : (
        <>
          <SectionTitle title="Key metrics" style={styles.sectionGap} />
          <View
            style={[
              styles.kpiGrid,
              kpiColumns > 1 && { gap: spacing.md },
            ]}
          >
            <KpiCard
              title="Fuel efficiency"
              value={`${formatNumber(metrics.fuelEfficiency)} km/L`}
              icon={Fuel}
              accentColor={colors.chart.primary}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Fleet utilization"
              value={formatPercentage(metrics.fleetUtilization, 1)}
              icon={Gauge}
              accentColor={colors.chart.amber}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Fuel cost"
              value={formatCurrency(metrics.fuelCost)}
              icon={Fuel}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Maintenance cost"
              value={formatCurrency(metrics.maintenanceCost)}
              icon={Wrench}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Other expenses"
              value={formatCurrency(metrics.otherExpenses)}
              icon={IndianRupee}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Operational cost"
              value={formatCurrency(metrics.operationalCost)}
              icon={IndianRupee}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Revenue"
              value={formatCurrency(metrics.revenue)}
              icon={IndianRupee}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
            <KpiCard
              title="Vehicle ROI"
              value={formatPercentage(metrics.vehicleRoi, 1)}
              icon={Truck}
              style={[
                styles.kpiItem,
                kpiColumns === 1 && styles.kpiFull,
                kpiColumns === 2 && styles.kpiHalf,
                kpiColumns === 3 && styles.kpiThird,
              ]}
            />
          </View>

          {hasCostData ? (
            <SimpleBarChart
              title="Cost breakdown"
              labels={['Fuel', 'Maintenance', 'Expenses']}
              data={[
                costs.fuel ?? metrics.fuelCost ?? 0,
                costs.maintenance ?? metrics.maintenanceCost ?? 0,
                costs.expenses ?? metrics.otherExpenses ?? 0,
              ]}
              color={colors.chart.primary}
              style={styles.chartCard}
              accessibilityLabel="Cost breakdown chart"
            />
          ) : null}

          {hasFleetStatus ? (
            <SimpleBarChart
              title="Fleet status counts"
              labels={['Available', 'On trip', 'In shop', 'Retired']}
              data={[
                vehicles.available ?? 0,
                vehicles.onTrip ?? 0,
                vehicles.inShop ?? 0,
                vehicles.retired ?? 0,
              ]}
              color={colors.chart.blue}
              style={styles.chartCard}
              accessibilityLabel="Fleet status counts chart"
            />
          ) : null}

          <Card style={styles.formulasCard}>
            <SectionTitle
              title="Financial formulas"
              subtitle="How key metrics are calculated."
            />
            <FormulaRow
              label="Fuel efficiency"
              formula="distance ÷ litres"
            />
            <FormulaRow
              label="Fleet utilization"
              formula="on-trip ÷ active vehicles × 100"
            />
            <FormulaRow
              label="Operational cost"
              formula="fuel + maintenance + expenses"
            />
            <FormulaRow
              label="ROI"
              formula="(revenue − acquisition − operational) ÷ (acquisition + operational) × 100"
            />
          </Card>
        </>
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  alert: {
    marginBottom: spacing.lg,
  },
  sectionGap: {
    marginTop: spacing.md,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  kpiItem: {
    marginBottom: spacing.md,
  },
  kpiFull: {
    width: '100%',
  },
  kpiHalf: {
    width: '48%',
    flexGrow: 1,
  },
  kpiThird: {
    width: '31%',
    flexGrow: 1,
    minWidth: 140,
  },
  chartCard: {
    marginBottom: spacing.lg,
  },
  formulasCard: {
    marginBottom: spacing['3xl'],
  },
  formulaRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  formulaLabel: {
    ...typography.caption,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  formulaText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
})
