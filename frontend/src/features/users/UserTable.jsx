import { Link, useNavigate } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, UserCog } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import TableActions from '../../components/tables/TableActions'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGate from '../../components/common/PermissionGate'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { ROLE_LABELS } from '../../constants/roles'
import { USER_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import { formatDate } from '../../utils/formatters'

export default function UserTable({
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
  emptyAction,
}) {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <Link
          to={buildPath(ROUTES.ADMIN_USER_DETAIL, { id: row.id })}
          className="font-medium text-teal-700 hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => ROLE_LABELS[row.role] || row.role,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
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
      emptyTitle="No users found"
      emptyDescription="Try adjusting filters or create a user."
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
        <UserRowActions row={row} onChangeStatus={onChangeStatus} />
      )}
    />
  )
}

function UserRowActions({ row, onChangeStatus }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const detailPath = buildPath(ROUTES.ADMIN_USER_DETAIL, { id: row.id })
  const editPath = buildPath(ROUTES.ADMIN_USER_EDIT, { id: row.id })
  const nextStatus =
    row.status === USER_STATUS.ACTIVE
      ? USER_STATUS.INACTIVE
      : USER_STATUS.ACTIVE

  const menuItems = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(detailPath),
    },
  ]

  if (hasPermission(PERMISSIONS.USERS_EDIT)) {
    menuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(editPath),
    })
  }

  if (hasPermission(PERMISSIONS.USERS_CHANGE_STATUS)) {
    menuItems.push({
      id: 'status',
      label: nextStatus === USER_STATUS.ACTIVE ? 'Activate' : 'Deactivate',
      icon: UserCog,
      onClick: () => onChangeStatus?.(row),
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
        <PermissionGate permission={PERMISSIONS.USERS_EDIT}>
          <Link
            to={editPath}
            className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>
        </PermissionGate>
        <PermissionGate permission={PERMISSIONS.USERS_CHANGE_STATUS}>
          <button
            type="button"
            onClick={() => onChangeStatus?.(row)}
            className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            {nextStatus === USER_STATUS.ACTIVE ? 'Activate' : 'Deactivate'}
          </button>
        </PermissionGate>
      </div>

      <div className="xl:hidden">
        <TableActions
          resource="users"
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
