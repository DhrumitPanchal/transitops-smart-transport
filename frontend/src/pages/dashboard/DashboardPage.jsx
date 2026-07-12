import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, RefreshCw, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import InlineAlert from '../../components/feedback/InlineAlert'
import ConfirmDialog from '../../components/common/ConfirmDialog'
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
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/formatters'
import { ROLE_LABELS } from '../../constants/roles'
import { ROUTES } from '../../constants/routes'
import { getErrorMessage } from '../../api/apiError'

function PendingDashboard({ user, onLogout, loggingOut }) {
  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Registration submitted"
        description="Your account is waiting for administrator approval."
      />

      <Card>
        <InlineAlert tone="warning" title="Pending approval">
          A Super Admin must review your account and assign an operational role
          before you can access fleet modules.
        </InlineAlert>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-800">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <StatusBadge status={user.status} />
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-slate-500">Registered</dt>
            <dd className="font-medium text-slate-800">
              {formatDateTime(user.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to={ROUTES.PROFILE}>
            <Button variant="secondary" icon={UserRound}>
              Profile
            </Button>
          </Link>
          <Button
            variant="danger"
            icon={LogOut}
            loading={loggingOut}
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </Card>
    </PageContainer>
  )
}

export default function DashboardPage() {
  const { role, hasPermission } = usePermission()
  const { user, isPendingApproval, logout, isLoading } = useAuth()
  const dashboardQuery = useDashboardSummary({
    enabled: !isPendingApproval,
  })
  const refreshDashboard = useRefreshDashboard()
  const [refreshing, setRefreshing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setConfirmOpen(false)
    }
  }

  if (isPendingApproval && user) {
    return (
      <>
        <PendingDashboard
          user={user}
          loggingOut={loggingOut || isLoading}
          onLogout={() => setConfirmOpen(true)}
        />
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleLogout}
          title="Sign out"
          message="Are you sure you want to sign out of TransitOps?"
          confirmLabel="Logout"
          cancelLabel="Stay signed in"
          variant="danger"
          loading={loggingOut}
        />
      </>
    )
  }

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
