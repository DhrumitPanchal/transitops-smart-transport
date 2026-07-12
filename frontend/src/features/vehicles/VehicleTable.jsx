import { Link, useNavigate } from 'react-router-dom'
import { Ban, Eye, MoreHorizontal, Pencil } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import TableActions from '../../components/tables/TableActions'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGate from '../../components/common/PermissionGate'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { VEHICLE_TYPE_LABELS } from '../../constants/appConstants'
import { VEHICLE_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import {
  formatCurrency,
  formatDistance,
  formatWeight,
} from '../../utils/formatters'

export default function VehicleTable({
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
  onRetire,
  emptyAction,
}) {
  const columns = [
    {
      key: 'registrationNumber',
      header: 'Registration Number',
      sortable: true,
      render: (row) => (
        <Link
          to={buildPath(ROUTES.VEHICLE_DETAIL, { id: row.id })}
          className="font-medium text-teal-700 hover:underline"
        >
          {row.registrationNumber}
        </Link>
      ),
    },
    {
      key: 'vehicleName',
      header: 'Vehicle Name',
      sortable: true,
    },
    {
      key: 'model',
      header: 'Model',
      sortable: true,
    },
    {
      key: 'vehicleType',
      header: 'Vehicle Type',
      sortable: true,
      render: (row) => VEHICLE_TYPE_LABELS[row.vehicleType] || row.vehicleType,
    },
    {
      key: 'maxLoadCapacity',
      header: 'Maximum Load Capacity',
      sortable: true,
      render: (row) => formatWeight(row.maxLoadCapacity, 'kg'),
    },
    {
      key: 'odometer',
      header: 'Odometer',
      sortable: true,
      render: (row) => formatDistance(row.odometer, 'km'),
    },
    {
      key: 'acquisitionCost',
      header: 'Acquisition Cost',
      sortable: true,
      render: (row) => formatCurrency(row.acquisitionCost),
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
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
      emptyTitle="No vehicles found"
      emptyDescription="Try adjusting filters or add a new vehicle to the fleet."
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
        <VehicleRowActions row={row} onRetire={onRetire} />
      )}
    />
  )
}

function VehicleRowActions({ row, onRetire }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const detailPath = buildPath(ROUTES.VEHICLE_DETAIL, { id: row.id })
  const editPath = buildPath(ROUTES.VEHICLE_EDIT, { id: row.id })
  const canRetire =
    row.status !== VEHICLE_STATUS.ON_TRIP &&
    row.status !== VEHICLE_STATUS.RETIRED

  const menuItems = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(detailPath),
    },
  ]

  if (hasPermission(PERMISSIONS.VEHICLES_EDIT)) {
    menuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(editPath),
    })
  }

  if (hasPermission(PERMISSIONS.VEHICLES_RETIRE)) {
    menuItems.push({
      id: 'retire',
      label: 'Retire',
      icon: Ban,
      danger: true,
      disabled: !canRetire,
      onClick: () => onRetire?.(row),
    })
  }

  return (
    <div className="inline-flex items-center justify-end gap-1">
      <div className="hidden items-center gap-1 md:inline-flex">
        <Link
          to={detailPath}
          className="rounded-md px-2 py-1 text-sm text-teal-700 hover:bg-teal-50"
        >
          View
        </Link>

        <PermissionGate permission={PERMISSIONS.VEHICLES_EDIT}>
          <Link
            to={editPath}
            className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.VEHICLES_RETIRE}>
          <button
            type="button"
            disabled={!canRetire}
            onClick={() => onRetire?.(row)}
            className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              row.status === VEHICLE_STATUS.ON_TRIP
                ? 'Vehicles on a trip cannot be retired'
                : row.status === VEHICLE_STATUS.RETIRED
                  ? 'Vehicle is already retired'
                  : 'Retire vehicle'
            }
          >
            Retire
          </button>
        </PermissionGate>
      </div>

      <div className="md:hidden">
        <TableActions
          resource="vehicles"
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
