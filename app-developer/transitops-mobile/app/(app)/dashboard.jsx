import { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Bus,
  Fuel,
  Gauge,
  IndianRupee,
  MapPinned,
  ShieldAlert,
  Truck,
  Users,
  Wrench,
} from 'lucide-react-native'
import { useAuth } from '@/hooks/auth/useAuth'
import { usePermissions } from '@/hooks/auth/usePermissions'
import {
  useDashboardSummary,
  useRefreshDashboard,
} from '@/hooks/dashboard'
import { useUsers } from '@/hooks/users'
import {
  DASHBOARD_KPI_KEYS,
  DASHBOARD_SECTION_KEYS,
  canShowDashboardSection,
  getVisibleDashboardCharts,
  getVisibleDashboardKpis,
} from '@/features/dashboard/dashboardRoleConfig'
import { ROLES, ROLE_LABELS } from '@/constants/roles'
import { PERMISSIONS } from '@/constants/permissions'
import { USER_STATUS } from '@/constants/statuses'
import { ROUTES } from '@/constants/routes'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '@/utils/formatters'
import { getErrorMessage } from '@/api/apiError'
import { toast } from '@/components/feedback/Toast'
import AppScreen from '@/components/layout/AppScreen'
import SectionTitle from '@/components/common/SectionTitle'
import KpiCard from '@/components/common/KpiCard'
import Card from '@/components/common/Card'
import StatusBadge from '@/components/common/StatusBadge'
import ListCard from '@/components/lists/ListCard'
import Button from '@/components/common/Button'
import InlineAlert from '@/components/feedback/InlineAlert'
import ConfirmModal from '@/components/feedback/ConfirmModal'
import ErrorState from '@/components/feedback/ErrorState'
import SkeletonCard from '@/components/feedback/SkeletonCard'
import ScreenLoader from '@/components/feedback/ScreenLoader'
import SimpleBarChart from '@/components/charts/SimpleBarChart'
import SimpleLineChart from '@/components/charts/SimpleLineChart'
import { colors, spacing, typography, layout } from '@/theme'

const KPI_META = {
  [DASHBOARD_KPI_KEYS.ACTIVE_VEHICLES]: {
    title: 'Active Vehicles',
    icon: Truck,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.AVAILABLE_VEHICLES]: {
    title: 'Available Vehicles',
    icon: Bus,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.VEHICLES_ON_TRIP]: {
    title: 'Vehicles On Trip',
    icon: MapPinned,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.VEHICLES_IN_MAINTENANCE]: {
    title: 'Vehicles In Maintenance',
    icon: Wrench,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.ACTIVE_TRIPS]: {
    title: 'Active Trips',
    icon: MapPinned,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.PENDING_TRIPS]: {
    title: 'Pending Trips',
    icon: MapPinned,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.DRIVERS_ON_DUTY]: {
    title: 'Drivers On Duty',
    icon: Users,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.AVAILABLE_DRIVERS]: {
    title: 'Available Drivers',
    icon: Users,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.FLEET_UTILIZATION]: {
    title: 'Fleet Utilization',
    icon: Gauge,
    format: (value) => `${formatNumber(value)}%`,
  },
  [DASHBOARD_KPI_KEYS.TOTAL_OPERATIONAL_COST]: {
    title: 'Total Operational Cost',
    icon: IndianRupee,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.FUEL_COST]: {
    title: 'Fuel Cost',
    icon: Fuel,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.MAINTENANCE_COST]: {
    title: 'Maintenance Cost',
    icon: Wrench,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.EXPENSES]: {
    title: 'Expenses',
    icon: IndianRupee,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.REVENUE]: {
    title: 'Revenue',
    icon: IndianRupee,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.VEHICLE_ROI]: {
    title: 'Vehicle ROI',
    icon: Gauge,
    format: (value) => `${formatNumber(value)}%`,
  },
  [DASHBOARD_KPI_KEYS.FUEL_EFFICIENCY]: {
    title: 'Fuel Efficiency',
    icon: Fuel,
    format: (value) => `${formatNumber(value)} km/L`,
  },
  [DASHBOARD_KPI_KEYS.EXPIRED_LICENCES]: {
    title: 'Expired Licences',
    icon: ShieldAlert,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.EXPIRING_LICENCES]: {
    title: 'Expiring Licences',
    icon: ShieldAlert,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.SUSPENDED_DRIVERS]: {
    title: 'Suspended Drivers',
    icon: ShieldAlert,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.AVERAGE_SAFETY_SCORE]: {
    title: 'Avg Safety Score',
    icon: ShieldAlert,
    format: (value) => formatNumber(value),
  },
}

function PendingDashboard({ user, onLogout, loggingOut, onProfile }) {
  return (
    <View style={styles.pendingWrap}>
      <SectionTitle
        title="Registration submitted"
        subtitle="Your account is waiting for administrator approval."
      />

      <Card>
        <InlineAlert
          variant="warning"
          title="Pending approval"
          message="A Super Admin must review your account and assign an operational role before you can access fleet modules."
          style={styles.pendingAlert}
        />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} allowFontScaling>
            Name
          </Text>
          <Text style={styles.detailValue} allowFontScaling>
            {user?.name || '—'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} allowFontScaling>
            Email
          </Text>
          <Text style={styles.detailValue} allowFontScaling>
            {user?.email || '—'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel} allowFontScaling>
            Status
          </Text>
          <StatusBadge status={user?.status || USER_STATUS.PENDING} />
        </View>
        <View style={[styles.detailRow, styles.detailRowLast]}>
          <Text style={styles.detailLabel} allowFontScaling>
            Registered
          </Text>
          <Text style={styles.detailValue} allowFontScaling>
            {formatDateTime(user?.createdAt)}
          </Text>
        </View>

        <View style={styles.pendingActions}>
          <Button
            title="Profile"
            variant="secondary"
            onPress={onProfile}
            accessibilityLabel="Open profile"
            style={styles.pendingBtn}
          />
          <Button
            title="Log out"
            variant="danger"
            loading={loggingOut}
            onPress={onLogout}
            accessibilityLabel="Log out"
            style={styles.pendingBtn}
          />
        </View>
      </Card>
    </View>
  )
}

function KpiGrid({ kpis, visibleKeys, columns }) {
  if (!visibleKeys.length) return null

  return (
    <View style={styles.kpiGrid}>
      {visibleKeys.map((key) => {
        const meta = KPI_META[key]
        if (!meta) return null
        return (
          <View
            key={key}
            style={[styles.kpiItem, { width: `${100 / columns - 1}%` }]}
          >
            <KpiCard
              title={meta.title}
              value={meta.format(kpis?.[key])}
              icon={meta.icon}
              accessibilityLabel={`${meta.title}: ${meta.format(kpis?.[key])}`}
            />
          </View>
        )
      })}
    </View>
  )
}

function DashboardChartsSection({ charts, visibleCharts }) {
  if (!visibleCharts.length) return null

  return (
    <View style={styles.section}>
      <SectionTitle title="Charts" subtitle="Operational trends and mix." />
      {visibleCharts.includes('vehicleStatusDistribution') ? (
        <SimpleBarChart
          title="Vehicle status"
          labels={(charts.vehicleStatusDistribution || []).map((item) =>
            String(item.status || '').replace(/_/g, ' '),
          )}
          data={(charts.vehicleStatusDistribution || []).map((item) => item.value)}
          style={styles.chartCard}
          accessibilityLabel="Vehicle status distribution chart"
        />
      ) : null}
      {visibleCharts.includes('tripStatusDistribution') ? (
        <SimpleBarChart
          title="Trip status"
          labels={(charts.tripStatusDistribution || []).map((item) =>
            String(item.status || '').replace(/_/g, ' '),
          )}
          data={(charts.tripStatusDistribution || []).map((item) => item.value)}
          color={colors.chart.blue}
          style={styles.chartCard}
          accessibilityLabel="Trip status distribution chart"
        />
      ) : null}
      {visibleCharts.includes('monthlyFuelCost') ? (
        <SimpleLineChart
          title="Monthly fuel cost"
          labels={(charts.monthlyFuelCost || []).map((item) => item.label)}
          data={(charts.monthlyFuelCost || []).map((item) => item.value)}
          yAxisSuffix=""
          style={styles.chartCard}
          accessibilityLabel="Monthly fuel cost chart"
        />
      ) : null}
      {visibleCharts.includes('monthlyMaintenanceCost') ? (
        <SimpleLineChart
          title="Monthly maintenance cost"
          labels={(charts.monthlyMaintenanceCost || []).map((item) => item.label)}
          data={(charts.monthlyMaintenanceCost || []).map((item) => item.value)}
          color={colors.chart.amber}
          style={styles.chartCard}
          accessibilityLabel="Monthly maintenance cost chart"
        />
      ) : null}
      {visibleCharts.includes('expenseBreakdown') ? (
        <SimpleBarChart
          title="Expense breakdown"
          labels={(charts.expenseBreakdown || []).map((item) => item.label || item.type)}
          data={(charts.expenseBreakdown || []).map((item) => item.value)}
          color={colors.chart.red}
          style={styles.chartCard}
          accessibilityLabel="Expense breakdown chart"
        />
      ) : null}
    </View>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { user, isPending, logout, isLoading: authLoading } = useAuth()
  const { role, hasPermission } = usePermissions()
  const refreshDashboard = useRefreshDashboard()

  const [refreshing, setRefreshing] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const dashboardQuery = useDashboardSummary(
    {},
    { enabled: !isPending },
  )

  const pendingUsersQuery = useUsers(
    { status: USER_STATUS.PENDING, limit: 8 },
    {
      enabled:
        !isPending &&
        role === ROLES.SUPER_ADMIN &&
        hasPermission(PERMISSIONS.USERS_VIEW),
    },
  )

  const columns = width >= 900 ? 3 : width >= 600 ? 2 : 1

  const summary = dashboardQuery.data?.data
  const kpis = summary?.kpis || {}
  const charts = summary?.charts || {}
  const sections = summary?.sections || {}

  const visibleKpis = useMemo(
    () => getVisibleDashboardKpis(role, hasPermission),
    [role, hasPermission],
  )
  const visibleCharts = useMemo(
    () => getVisibleDashboardCharts(role, hasPermission),
    [role, hasPermission],
  )

  const sectionOpts = useMemo(
    () => ({ role, hasPermission }),
    [role, hasPermission],
  )

  const showKpis = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.KPI_GRID,
    sectionOpts,
  )
  const showCharts = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.CHARTS,
    sectionOpts,
  )
  const showRecentTrips = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.RECENT_TRIPS,
    sectionOpts,
  )
  const showExpiring = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.EXPIRING_LICENCES,
    sectionOpts,
  )
  const showMaintenance = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.VEHICLES_IN_MAINTENANCE,
    sectionOpts,
  )
  const showSafety = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.SAFETY_FOCUS,
    sectionOpts,
  )
  const showFinancial = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.FINANCIAL_FOCUS,
    sectionOpts,
  )
  const showPendingUsers = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.PENDING_USERS,
    sectionOpts,
  )

  const pendingUsers = pendingUsersQuery.data?.data || []

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
      setLogoutOpen(false)
      router.replace('/(auth)/login')
    } finally {
      setLoggingOut(false)
    }
  }, [logout, router])

  const onRefresh = useCallback(async () => {
    if (refreshing || isPending) return
    setRefreshing(true)
    try {
      await refreshDashboard()
      if (showPendingUsers) {
        await pendingUsersQuery.refetch()
      }
      toast.success('Dashboard refreshed')
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }, [
    isPending,
    pendingUsersQuery,
    refreshDashboard,
    refreshing,
    showPendingUsers,
  ])

  if (isPending && user) {
    return (
      <AppScreen scroll>
        <PendingDashboard
          user={user}
          loggingOut={loggingOut || authLoading}
          onLogout={() => setLogoutOpen(true)}
          onProfile={() => router.push(ROUTES.PROFILE)}
        />
        <ConfirmModal
          visible={logoutOpen}
          title="Sign out"
          message="Are you sure you want to sign out of TransitOps?"
          confirmLabel="Log out"
          cancelLabel="Stay signed in"
          destructive
          loading={loggingOut}
          onCancel={() => (loggingOut ? null : setLogoutOpen(false))}
          onConfirm={handleLogout}
        />
      </AppScreen>
    )
  }

  if (dashboardQuery.isLoading) {
    return (
      <AppScreen scroll>
        <SectionTitle title="Dashboard" subtitle="Loading overview…" />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} style={styles.skeletonGap} />
      </AppScreen>
    )
  }

  if (dashboardQuery.isError || !summary) {
    return (
      <AppScreen>
        <ErrorState
          title="Unable to load dashboard"
          message={getErrorMessage(dashboardQuery.error)}
          onRetry={() => dashboardQuery.refetch()}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing || dashboardQuery.isFetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          accessibilityLabel="Pull to refresh dashboard"
        />
      }
    >
      <SectionTitle
        title="Dashboard"
        subtitle={`${ROLE_LABELS[role] || 'Operations'} overview · updated ${formatDateTime(summary.generatedAt)}`}
      />

      {showKpis ? (
        <View style={styles.section}>
          <KpiGrid kpis={kpis} visibleKeys={visibleKpis} columns={columns} />
        </View>
      ) : null}

      {showCharts ? (
        <DashboardChartsSection charts={charts} visibleCharts={visibleCharts} />
      ) : null}

      {showFinancial ? (
        <View style={styles.section}>
          <SectionTitle
            title="Financial focus"
            subtitle="Cost, revenue and return snapshot."
          />
          <View style={styles.kpiGrid}>
            {[
              DASHBOARD_KPI_KEYS.REVENUE,
              DASHBOARD_KPI_KEYS.TOTAL_OPERATIONAL_COST,
              DASHBOARD_KPI_KEYS.VEHICLE_ROI,
            ].map((key) => {
              const meta = KPI_META[key]
              if (!meta) return null
              return (
                <View
                  key={key}
                  style={[styles.kpiItem, { width: `${100 / Math.min(columns, 3) - 1}%` }]}
                >
                  <KpiCard
                    title={meta.title}
                    value={meta.format(kpis?.[key])}
                    icon={meta.icon}
                  />
                </View>
              )
            })}
          </View>
        </View>
      ) : null}

      {showSafety ? (
        <View style={styles.section}>
          <SectionTitle
            title="Safety focus"
            subtitle={`Avg safety score ${formatNumber(kpis.averageSafetyScore)}`}
          />
          {(sections.expiredLicences || []).slice(0, 5).map((driver) => (
            <ListCard
              key={`expired-${driver.id}`}
              title={driver.name}
              subtitle={`${driver.licenseNumber || '—'} · expired ${formatDate(driver.licenseExpiryDate)}`}
              right={<StatusBadge status={driver.status} size="sm" />}
              showChevron={false}
              accessibilityLabel={`${driver.name}, expired licence`}
            />
          ))}
          {(sections.suspendedDrivers || []).slice(0, 5).map((driver) => (
            <ListCard
              key={`suspended-${driver.id}`}
              title={driver.name}
              subtitle={`Suspended · safety ${formatNumber(driver.safetyScore)}`}
              right={<StatusBadge status={driver.status} size="sm" />}
              showChevron={false}
              accessibilityLabel={`${driver.name}, suspended`}
            />
          ))}
          {!sections.expiredLicences?.length && !sections.suspendedDrivers?.length ? (
            <Text style={styles.emptyText} allowFontScaling>
              No safety alerts right now.
            </Text>
          ) : null}
        </View>
      ) : null}

      {showPendingUsers ? (
        <View style={styles.section}>
          <SectionTitle
            title="Pending users"
            subtitle="Awaiting approval and role assignment."
          />
          {pendingUsersQuery.isLoading ? (
            <ScreenLoader message="Loading pending users…" />
          ) : pendingUsers.length === 0 ? (
            <Text style={styles.emptyText} allowFontScaling>
              No pending registrations.
            </Text>
          ) : (
            pendingUsers.map((pendingUser) => (
              <ListCard
                key={pendingUser.id}
                title={pendingUser.name}
                subtitle={pendingUser.email}
                meta={`Registered ${formatDateTime(pendingUser.createdAt)}`}
                right={<StatusBadge status={pendingUser.status} size="sm" />}
                showChevron={false}
                accessibilityLabel={`Pending user ${pendingUser.name}`}
              />
            ))
          )}
        </View>
      ) : null}

      {showRecentTrips ? (
        <View style={styles.section}>
          <SectionTitle
            title="Recent trips"
            subtitle="Latest trip activity across the fleet."
          />
          {(sections.recentTrips || []).length === 0 ? (
            <Text style={styles.emptyText} allowFontScaling>
              No recent trips.
            </Text>
          ) : (
            (sections.recentTrips || []).map((trip) => (
              <ListCard
                key={trip.id}
                title={trip.tripNumber || trip.id}
                subtitle={`${trip.source || '—'} → ${trip.destination || '—'}`}
                meta={`${trip.vehicleRegistration || '—'} · ${trip.driverName || '—'}`}
                right={<StatusBadge status={trip.status} size="sm" />}
                showChevron={false}
                accessibilityLabel={`Trip ${trip.tripNumber || trip.id}`}
              />
            ))
          )}
        </View>
      ) : null}

      {showExpiring ? (
        <View style={styles.section}>
          <SectionTitle
            title="Expiring driver licences"
            subtitle="Licences needing attention within 30 days."
          />
          {(sections.expiringLicences || []).length === 0 ? (
            <Text style={styles.emptyText} allowFontScaling>
              No licences expiring soon.
            </Text>
          ) : (
            (sections.expiringLicences || []).map((driver) => (
              <ListCard
                key={driver.id}
                title={driver.name}
                subtitle={`${driver.licenseNumber || '—'} · expires ${formatDate(driver.licenseExpiryDate)}`}
                right={<StatusBadge status={driver.status} size="sm" />}
                showChevron={false}
                accessibilityLabel={`${driver.name}, licence expiring`}
              />
            ))
          )}
        </View>
      ) : null}

      {showMaintenance ? (
        <View style={styles.section}>
          <SectionTitle
            title="Vehicles in maintenance"
            subtitle="Open and in-progress shop work."
          />
          {(sections.vehiclesInMaintenance || []).length === 0 ? (
            <Text style={styles.emptyText} allowFontScaling>
              No vehicles currently in maintenance.
            </Text>
          ) : (
            (sections.vehiclesInMaintenance || []).map((record) => (
              <ListCard
                key={record.id}
                title={
                  record.vehicleRegistration ||
                  record.vehicleName ||
                  record.id
                }
                subtitle={record.description || record.maintenanceType || 'Maintenance'}
                meta={formatCurrency(record.finalCost ?? record.cost)}
                right={<StatusBadge status={record.status} size="sm" />}
                showChevron={false}
                accessibilityLabel={`Maintenance ${record.vehicleRegistration || record.id}`}
              />
            ))
          )}
        </View>
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  pendingWrap: {
    gap: spacing.md,
  },
  pendingAlert: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pendingBtn: {
    flex: 1,
  },
  section: {
    marginBottom: layout.sectionGap,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 140,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.muted,
    paddingVertical: spacing.md,
  },
  skeletonGap: {
    marginTop: spacing.md,
  },
})
