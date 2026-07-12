import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import KpiCard from '../../components/common/KpiCard'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import InlineAlert from '../../components/feedback/InlineAlert'
import ReportFilters from '../../features/reports/ReportFilters'
import { downloadCsvExport } from '../../features/reports/downloadCsvExport'
import {
  useReportSummary,
  useExportReportCsv,
} from '../../hooks/reports'
import { useVehicles } from '../../hooks/vehicles'
import { PERMISSIONS } from '../../constants/permissions'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters'
import { getErrorMessage } from '../../api/apiError'

const INITIAL_FILTERS = {
  vehicleId: '',
  vehicleType: '',
  region: '',
  dateFrom: '',
  dateTo: '',
}

function cleanParams(filters) {
  const params = {}
  if (filters.vehicleId) params.vehicleId = filters.vehicleId
  if (filters.vehicleType) params.vehicleType = filters.vehicleType
  if (filters.region) params.region = filters.region
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  return params
}

export default function ReportsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const queryParams = useMemo(() => cleanParams(filters), [filters])

  const reportQuery = useReportSummary(queryParams)
  const exportMutation = useExportReportCsv()
  const vehiclesQuery = useVehicles({
    pageSize: 100,
    sortBy: 'registrationNumber',
  })

  const summary = reportQuery.data?.data
  const metrics = summary?.metrics || {}

  const vehicleOptions = (vehiclesQuery.data?.data || []).map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
  }))

  const regionOptions = useMemo(() => {
    const regions = new Set(
      (vehiclesQuery.data?.data || [])
        .map((vehicle) => vehicle.region)
        .filter(Boolean),
    )
    return [...regions].sort()
  }, [vehiclesQuery.data?.data])

  const handleExport = async () => {
    try {
      const payload = await exportMutation.mutateAsync(queryParams)
      const fileName = downloadCsvExport(payload)
      toast.success(`Exported ${fileName}`)
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to export CSV')
    }
  }

  if (reportQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Reports" description="Loading analytics..." />
        <TableSkeleton columns={4} rows={4} />
      </PageContainer>
    )
  }

  if (reportQuery.isError || !summary) {
    return (
      <PageContainer>
        <PageHeader title="Reports" />
        <ErrorState
          title="Unable to load reports"
          description={getErrorMessage(reportQuery.error)}
          onRetry={() => reportQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description={`Operational analytics · generated ${formatDateTime(summary.generatedAt)}`}
        actions={
          <PermissionGate permission={PERMISSIONS.REPORTS_EXPORT}>
            <Button
              icon={Download}
              loading={exportMutation.isPending}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </PermissionGate>
        }
      />

      {reportQuery.isStale ? (
        <div className="mb-4">
          <InlineAlert tone="warning" title="Report data may be outdated">
            Live events mark reports stale without automatic refetch. Adjust
            filters or reload this page to refresh.
          </InlineAlert>
        </div>
      ) : null}

      <ReportFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        vehicleOptions={vehicleOptions}
        regionOptions={regionOptions}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Fuel efficiency"
          value={`${formatNumber(metrics.fuelEfficiency)} km/L`}
        />
        <KpiCard
          title="Fleet utilization"
          value={`${formatNumber(metrics.fleetUtilization)}%`}
        />
        <KpiCard
          title="Fuel cost"
          value={formatCurrency(metrics.fuelCost)}
        />
        <KpiCard
          title="Maintenance cost"
          value={formatCurrency(metrics.maintenanceCost)}
        />
        <KpiCard
          title="Other expenses"
          value={formatCurrency(metrics.otherExpenses)}
        />
        <KpiCard
          title="Operational cost"
          value={formatCurrency(metrics.operationalCost)}
        />
        <KpiCard title="Revenue" value={formatCurrency(metrics.revenue)} />
        <KpiCard
          title="Vehicle ROI"
          value={`${formatNumber(metrics.vehicleRoi)}%`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Fleet snapshot" />
          <dl className="mt-3 divide-y divide-slate-100">
            {[
              ['Total vehicles', summary.vehicles?.total],
              ['Available', summary.vehicles?.available],
              ['On trip', summary.vehicles?.onTrip],
              ['In shop', summary.vehicles?.inShop],
              ['Retired', summary.vehicles?.retired],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 text-sm"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">
                  {formatNumber(value, { maximumFractionDigits: 0 })}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <SectionTitle title="Trip snapshot" />
          <dl className="mt-3 divide-y divide-slate-100">
            {[
              ['Total trips', summary.trips?.total],
              ['Draft', summary.trips?.draft],
              ['Dispatched', summary.trips?.dispatched],
              ['Completed', summary.trips?.completed],
              ['Cancelled', summary.trips?.cancelled],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 text-sm"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">
                  {formatNumber(value, { maximumFractionDigits: 0 })}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </PageContainer>
  )
}
