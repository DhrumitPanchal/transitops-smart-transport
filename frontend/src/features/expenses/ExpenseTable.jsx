import { Link, useNavigate } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import DataTable from '../../components/tables/DataTable'
import TableActions from '../../components/tables/TableActions'
import PermissionGate from '../../components/common/PermissionGate'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { EXPENSE_TYPE_LABELS } from '../../constants/appConstants'
import { buildPath } from '../../utils/helpers'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function ExpenseTable({
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
  onDelete,
  emptyAction,
}) {
  const columns = [
    {
      key: 'expenseDate',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.expenseDate),
    },
    {
      key: 'expenseType',
      header: 'Expense Type',
      sortable: true,
      render: (row) => EXPENSE_TYPE_LABELS[row.expenseType] || row.expenseType,
    },
    {
      key: 'vehicleRegistration',
      header: 'Vehicle',
      sortable: true,
      render: (row) =>
        row.vehicleRegistration ||
        row.vehicle?.registrationNumber ||
        row.vehicleId ||
        '—',
    },
    {
      key: 'tripNumber',
      header: 'Trip',
      render: (row) => row.tripNumber || row.trip?.tripNumber || '—',
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (row) => (
        <span className="line-clamp-2 max-w-xs">{row.description}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => formatCurrency(row.amount),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No expenses found"
      emptyDescription="Try adjusting filters or add an expense."
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
        <ExpenseRowActions row={row} onDelete={onDelete} />
      )}
    />
  )
}

function ExpenseRowActions({ row, onDelete }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const detailPath = buildPath(ROUTES.EXPENSE_DETAIL, { id: row.id })
  const editPath = buildPath(ROUTES.EXPENSE_EDIT, { id: row.id })

  const menuItems = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(detailPath),
    },
  ]

  if (hasPermission(PERMISSIONS.EXPENSES_EDIT)) {
    menuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(editPath),
    })
  }

  if (hasPermission(PERMISSIONS.EXPENSES_DELETE)) {
    menuItems.push({
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: () => onDelete?.(row),
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
        <PermissionGate permission={PERMISSIONS.EXPENSES_EDIT}>
          <Link
            to={editPath}
            className="rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>
        </PermissionGate>
        <PermissionGate permission={PERMISSIONS.EXPENSES_DELETE}>
          <button
            type="button"
            onClick={() => onDelete?.(row)}
            className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </PermissionGate>
      </div>

      <div className="xl:hidden">
        <TableActions
          resource="expenses"
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
