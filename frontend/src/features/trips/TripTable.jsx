import { Link, useNavigate } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Send,
} from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import TableActions from '../../components/tables/TableActions'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGate from '../../components/common/PermissionGate'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { TRIP_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import {
  formatDate,
  formatDistance,
  formatWeight,
} from '../../utils/formatters'

export default function TripTable({
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
  onDispatch,
  onComplete,
  onCancel,
  emptyAction,
}) {
  const columns = [
    {
      key: 'tripNumber',
      header: 'Trip Number',
      sortable: true,
      render: (row) => (
        <Link
          to={buildPath(ROUTES.TRIP_DETAIL, { id: row.id })}
          className="font-medium text-teal-700 hover:underline"
        >
          {row.tripNumber || row.id}
        </Link>
      ),
    },
    { key: 'source', header: 'Source', sortable: true },
    { key: 'destination', header: 'Destination', sortable: true },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) =>
        row.vehicleRegistration ||
        row.vehicle?.registrationNumber ||
        row.vehicleId,
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (row) => row.driverName || row.driver?.name || row.driverId,
    },
    {
      key: 'cargoWeight',
      header: 'Cargo Weight',
      sortable: true,
      render: (row) => formatWeight(row.cargoWeight, 'kg'),
    },
    {
      key: 'plannedDistance',
      header: 'Planned Distance',
      sortable: true,
      render: (row) => formatDistance(row.plannedDistance, 'km'),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No trips found"
      emptyDescription="Try adjusting filters or create a new trip."
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
        <TripRowActions
          row={row}
          onDispatch={onDispatch}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      )}
    />
  )
}

function TripRowActions({ row, onDispatch, onComplete, onCancel }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const detailPath = buildPath(ROUTES.TRIP_DETAIL, { id: row.id })
  const editPath = buildPath(ROUTES.TRIP_EDIT, { id: row.id })
  const isDraft = row.status === TRIP_STATUS.DRAFT
  const isDispatched = row.status === TRIP_STATUS.DISPATCHED

  const menuItems = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(detailPath),
    },
  ]

  if (isDraft && hasPermission(PERMISSIONS.TRIPS_EDIT_DRAFT)) {
    menuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(editPath),
    })
  }

  if (isDraft && hasPermission(PERMISSIONS.TRIPS_DISPATCH)) {
    menuItems.push({
      id: 'dispatch',
      label: 'Dispatch',
      icon: Send,
      onClick: () => onDispatch?.(row),
    })
  }

  if (isDispatched && hasPermission(PERMISSIONS.TRIPS_COMPLETE)) {
    menuItems.push({
      id: 'complete',
      label: 'Complete',
      icon: CheckCircle2,
      onClick: () => onComplete?.(row),
    })
  }

  if (
    (isDraft || isDispatched) &&
    hasPermission(PERMISSIONS.TRIPS_CANCEL)
  ) {
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

        {isDraft ? (
          <PermissionGate permission={PERMISSIONS.TRIPS_EDIT_DRAFT}>
            <Link
              to={editPath}
              className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Edit
            </Link>
          </PermissionGate>
        ) : null}

        {isDraft ? (
          <PermissionGate permission={PERMISSIONS.TRIPS_DISPATCH}>
            <button
              type="button"
              onClick={() => onDispatch?.(row)}
              className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Dispatch
            </button>
          </PermissionGate>
        ) : null}

        {isDispatched ? (
          <PermissionGate permission={PERMISSIONS.TRIPS_COMPLETE}>
            <button
              type="button"
              onClick={() => onComplete?.(row)}
              className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Complete
            </button>
          </PermissionGate>
        ) : null}

        {isDraft || isDispatched ? (
          <PermissionGate permission={PERMISSIONS.TRIPS_CANCEL}>
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
          resource="trips"
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
