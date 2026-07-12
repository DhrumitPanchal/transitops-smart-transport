import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import InlineAlert from '../../components/feedback/InlineAlert'
import DashboardKpiGrid from '../../features/dashboard/DashboardKpiGrid'
import DashboardCharts from '../../features/dashboard/DashboardCharts'
import {
  RecentTripsSection,
  ExpiringLicencesSection,
  VehiclesInMaintenanceSection,
  SafetyFocusSection,
  FinancialFocusSection,
} from '../../features/dashboard/DashboardSections'
import {
  DASHBOARD_SECTION_KEYS,
  canShowDashboardSection,
  getVisibleDashboardCharts,
  getVisibleDashboardKpis,
} from '../../features/dashboard/dashboardRoleConfig'
import {
  useDashboardSummary,
  useRefreshDashboard,
} from '../../hooks/dashboard'
import { usePermission } from '../../hooks/usePermission'
import { formatDateTime } from '../../utils/formatters'
import { ROLE_LABELS } from '../../constants/roles'
import { getErrorMessage } from '../../api/apiError'

export default function DashboardPage() {
  const { role, hasPermission } = usePermission()
  const dashboardQuery = useDashboardSummary()
  const refreshDashboard = useRefreshDashboard()
  const [refreshing, setRefreshing] = useState(false)

  const summary = dashboardQuery.data?.data
  const kpis = summary?.kpis || {}
  const charts = summary?.charts || {}
  const sections = summary?.sections || {}

  const visibleKpis = getVisibleDashboardKpis(role, hasPermission)
  const visibleCharts = getVisibleDashboardCharts(role, hasPermission)

  const showKpis = canShowDashboardSection(DASHBOARD_SECTION_KEYS.KPI_GRID, {
    role,
    hasPermission,
  })
  const showCharts = canShowDashboardSection(DASHBOARD_SECTION_KEYS.CHARTS, {
    role,
    hasPermission,
  })
  const showRecentTrips = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.RECENT_TRIPS,
    { role, hasPermission },
  )
  const showExpiring = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.EXPIRING_LICENCES,
    { role, hasPermission },
  )
  const showMaintenance = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.VEHICLES_IN_MAINTENANCE,
    { role, hasPermission },
  )
  const showSafety = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.SAFETY_FOCUS,
    { role, hasPermission },
  )
  const showFinancial = canShowDashboardSection(
    DASHBOARD_SECTION_KEYS.FINANCIAL_FOCUS,
    { role, hasPermission },
  )

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await refreshDashboard()
      toast.success('Dashboard refreshed')
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  if (dashboardQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Loading overview..." />
        <TableSkeleton columns={4} rows={4} />
      </PageContainer>
    )
  }

  if (dashboardQuery.isError || !summary) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Unable to load dashboard"
          description={getErrorMessage(dashboardQuery.error)}
          onRetry={() => dashboardQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`${ROLE_LABELS[role] || 'Operations'} overview · updated ${formatDateTime(summary.generatedAt)}`}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={refreshing || dashboardQuery.isFetching}
            onClick={handleRefresh}
          >
            Refresh Dashboard
          </Button>
        }
      />

      {dashboardQuery.isStale ? (
        <div className="mb-4">
          <InlineAlert tone="warning" title="Dashboard may be outdated">
            Live events mark this view stale without auto-refresh. Use Refresh
            Dashboard for the latest totals, charts, and lists.
          </InlineAlert>
        </div>
      ) : null}

      <div className="space-y-6">
        {showKpis ? (
          <DashboardKpiGrid kpis={kpis} visibleKeys={visibleKpis} />
        ) : null}

        {showCharts ? (
          <DashboardCharts charts={charts} visibleCharts={visibleCharts} />
        ) : null}

        {showFinancial ? <FinancialFocusSection kpis={kpis} /> : null}

        {showSafety ? (
          <SafetyFocusSection
            expired={sections.expiredLicences}
            suspended={sections.suspendedDrivers}
            averageSafetyScore={kpis.averageSafetyScore}
          />
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {showRecentTrips ? (
            <RecentTripsSection trips={sections.recentTrips} />
          ) : null}
          {showExpiring ? (
            <ExpiringLicencesSection drivers={sections.expiringLicences} />
          ) : null}
          {showMaintenance ? (
            <VehiclesInMaintenanceSection
              records={sections.vehiclesInMaintenance}
            />
          ) : null}
        </div>
      </div>
    </PageContainer>
  )
}
