import { Link, useNavigate } from 'react-router-dom'
import { Ban, Eye, MoreHorizontal, Pencil, RefreshCw } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import TableActions from '../../components/tables/TableActions'
import StatusBadge from '../../components/common/StatusBadge'
import Badge from '../../components/common/Badge'
import PermissionGate from '../../components/common/PermissionGate'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { LICENCE_CATEGORY_LABELS } from '../../constants/appConstants'
import { DRIVER_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import { formatDate } from '../../utils/formatters'
import {
  getLicenseCondition,
  LICENSE_CONDITION_LABELS,
  LICENSE_CONDITIONS,
} from './doesDriverMatchFilters'

const CONDITION_TONES = {
  [LICENSE_CONDITIONS.VALID]: 'green',
  [LICENSE_CONDITIONS.EXPIRING_SOON]: 'amber',
  [LICENSE_CONDITIONS.EXPIRED]: 'red',
}

export default function DriverTable({
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
  onChangeStatus,
  onSuspend,
  emptyAction,
}) {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <Link
          to={buildPath(ROUTES.DRIVER_DETAIL, { id: row.id })}
          className="font-medium text-teal-700 hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'licenseNumber',
      header: 'Licence Number',
      sortable: true,
    },
    {
      key: 'licenseCategory',
      header: 'Licence Category',
      sortable: true,
      render: (row) =>
        LICENCE_CATEGORY_LABELS[row.licenseCategory] || row.licenseCategory,
    },
    {
      key: 'licenseExpiryDate',
      header: 'Licence Expiry Date',
      sortable: true,
      render: (row) => formatDate(row.licenseExpiryDate),
    },
    {
      key: 'contactNumber',
      header: 'Contact',
      sortable: true,
    },
    {
      key: 'safetyScore',
      header: 'Safety Score',
      sortable: true,
    },
    {
      key: 'licenseCondition',
      header: 'Licence Condition',
      render: (row) => {
        const condition = getLicenseCondition(row.licenseExpiryDate)
        return (
          <Badge tone={CONDITION_TONES[condition] || 'slate'}>
            {LICENSE_CONDITION_LABELS[condition]}
          </Badge>
        )
      },
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
      emptyTitle="No drivers found"
      emptyDescription="Try adjusting filters or add a new driver."
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
        <DriverRowActions
          row={row}
          onChangeStatus={onChangeStatus}
          onSuspend={onSuspend}
        />
      )}
    />
  )
}

function DriverRowActions({ row, onChangeStatus, onSuspend }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const detailPath = buildPath(ROUTES.DRIVER_DETAIL, { id: row.id })
  const editPath = buildPath(ROUTES.DRIVER_EDIT, { id: row.id })
  const canSuspend =
    row.status !== DRIVER_STATUS.ON_TRIP &&
    row.status !== DRIVER_STATUS.SUSPENDED

  const menuItems = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(detailPath),
    },
  ]

  if (hasPermission(PERMISSIONS.DRIVERS_EDIT)) {
    menuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(editPath),
    })
  }

  if (hasPermission(PERMISSIONS.DRIVERS_CHANGE_STATUS)) {
    menuItems.push({
      id: 'change-status',
      label: 'Change status',
      icon: RefreshCw,
      disabled: row.status === DRIVER_STATUS.ON_TRIP,
      onClick: () => onChangeStatus?.(row),
    })
  }

  if (hasPermission(PERMISSIONS.DRIVERS_SUSPEND)) {
    menuItems.push({
      id: 'suspend',
      label: 'Suspend',
      icon: Ban,
      danger: true,
      disabled: !canSuspend,
      onClick: () => onSuspend?.(row),
    })
  }

  return (
    <div className="inline-flex items-center justify-end gap-1">
      <div className="hidden items-center gap-1 lg:inline-flex">
        <Link
          to={detailPath}
          className="rounded-md px-2 py-1 text-sm text-teal-700 hover:bg-teal-50"
        >
          View
        </Link>

        <PermissionGate permission={PERMISSIONS.DRIVERS_EDIT}>
          <Link
            to={editPath}
            className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.DRIVERS_CHANGE_STATUS}>
          <button
            type="button"
            disabled={row.status === DRIVER_STATUS.ON_TRIP}
            onClick={() => onChangeStatus?.(row)}
            className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Status
          </button>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.DRIVERS_SUSPEND}>
          <button
            type="button"
            disabled={!canSuspend}
            onClick={() => onSuspend?.(row)}
            className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              row.status === DRIVER_STATUS.ON_TRIP
                ? 'Drivers on a trip cannot be suspended'
                : row.status === DRIVER_STATUS.SUSPENDED
                  ? 'Driver is already suspended'
                  : 'Suspend driver'
            }
          >
            Suspend
          </button>
        </PermissionGate>
      </div>

      <div className="lg:hidden">
        <TableActions
          resource="drivers"
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
