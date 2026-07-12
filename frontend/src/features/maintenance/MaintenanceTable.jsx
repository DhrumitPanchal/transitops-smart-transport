import { Link, useNavigate } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import TableActions from '../../components/tables/TableActions'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGate from '../../components/common/PermissionGate'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { MAINTENANCE_STATUS } from '../../constants/statuses'
import { MAINTENANCE_TYPE_LABELS } from '../../constants/appConstants'
import { buildPath } from '../../utils/helpers'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function MaintenanceTable({
  rows = [],
  loading = false,
  error = null,
  sortBy,
  sortDirection,
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onComplete,
  onCancel,
  emptyAction,
}) {
  const columns = [
    {
      key: 'vehicleRegistration',
      header: 'Vehicle',
      sortable: true,
      render: (row) =>
        row.vehicleRegistration ||
        row.vehicle?.registrationNumber ||
        row.vehicleId,
    },
    {
      key: 'maintenanceType',
      header: 'Maintenance Type',
      sortable: true,
      render: (row) =>
        MAINTENANCE_TYPE_LABELS[row.maintenanceType] || row.maintenanceType,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => row.title || row.description || '—',
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      sortable: true,
      render: (row) => formatDate(row.scheduledDate || row.startDate),
    },
    {
      key: 'completedDate',
      header: 'Completed',
      sortable: true,
      render: (row) =>
        formatDate(row.completedDate || row.completionDate),
    },
    {
      key: 'estimatedCost',
      header: 'Cost',
      sortable: true,
      render: (row) =>
        formatCurrency(
          row.actualCost != null
            ? row.actualCost
            : row.finalCost != null
              ? row.finalCost
              : row.estimatedCost ?? row.cost,
        ),
    },
    {
      key: 'serviceCenter',
      header: 'Service center',
      sortable: true,
      render: (row) => row.serviceCenter || row.vendorName || '—',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No maintenance records found"
      emptyDescription="Try adjusting filters or schedule new maintenance."
      emptyAction={emptyAction}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      rowActions={(row) => (
        <MaintenanceRowActions
          row={row}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      )}
    />
  )
}

function MaintenanceRowActions({ row, onComplete, onCancel }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const detailPath = buildPath(ROUTES.MAINTENANCE_DETAIL, { id: row.id })
  const editPath = buildPath(ROUTES.MAINTENANCE_EDIT, { id: row.id })
  const isScheduled = row.status === MAINTENANCE_STATUS.SCHEDULED
  const isInProgress = row.status === MAINTENANCE_STATUS.IN_PROGRESS
  const isActive = isScheduled || isInProgress

  const menuItems = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(detailPath),
    },
  ]

  if (isActive && hasPermission(PERMISSIONS.MAINTENANCE_EDIT)) {
    menuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(editPath),
    })
  }

  if (isInProgress && hasPermission(PERMISSIONS.MAINTENANCE_COMPLETE)) {
    menuItems.push({
      id: 'complete',
      label: 'Complete',
      icon: CheckCircle2,
      onClick: () => onComplete?.(row),
    })
  }

  if (isScheduled && hasPermission(PERMISSIONS.MAINTENANCE_CANCEL)) {
    menuItems.push({
      id: 'cancel',
      label: 'Cancel',
      icon: Ban,
      danger: true,
      onClick: () => onCancel?.(row),
    })
  }

  return (
    <div className="inline-flex items-center justify-end gap-1">
      <div className="hidden items-center gap-1 xl:inline-flex">
        <Link
          to={detailPath}
          className="rounded-md px-2 py-1 text-sm text-teal-700 hover:bg-teal-50"
        >
          View
        </Link>

        {isActive ? (
          <PermissionGate permission={PERMISSIONS.MAINTENANCE_EDIT}>
            <Link
              to={editPath}
              className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Edit
            </Link>
          </PermissionGate>
        ) : null}

        {isInProgress ? (
          <PermissionGate permission={PERMISSIONS.MAINTENANCE_COMPLETE}>
            <button
              type="button"
              onClick={() => onComplete?.(row)}
              className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Complete
            </button>
          </PermissionGate>
        ) : null}

        {isScheduled ? (
          <PermissionGate permission={PERMISSIONS.MAINTENANCE_CANCEL}>
            <button
              type="button"
              onClick={() => onCancel?.(row)}
              className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Cancel
            </button>
          </PermissionGate>
        ) : null}
      </div>

      <div className="xl:hidden">
        <TableActions
          resource="maintenance"
          trigger={
            <span className="inline-flex rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          }
          items={menuItems}
        />
      </div>
    </div>
  )
}
