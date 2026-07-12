import SortButton from './SortButton'
import TableSkeleton from './TableSkeleton'
import EmptyTableState from './EmptyTableState'
import Pagination from './Pagination'
import PageSizeSelect from './PageSizeSelect'
import ErrorState from '../feedback/ErrorState'

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  error = null,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sortBy,
  sortDirection = 'asc',
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  rowActions,
  getRowId = (row) => row.id,
}) {
  if (loading) {
    return <TableSkeleton columns={columns.length || 4} />
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ErrorState title="Unable to load data" description={error} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 font-medium text-slate-600"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.sortable ? (
                    <SortButton
                      label={column.header}
                      active={sortBy === column.key}
                      direction={sortDirection}
                      onClick={() => onSortChange?.(column.key)}
                    />
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions ? (
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="p-0"
                >
                  <EmptyTableState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowId(row)} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-slate-700">
                      {column.render
                        ? column.render(row)
                        : row[column.key]}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-4 py-3 text-right">{rowActions(row)}</td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {typeof page === 'number' && typeof total === 'number' ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {onPageSizeChange ? (
            <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
          ) : (
            <span />
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </div>
  )
}
