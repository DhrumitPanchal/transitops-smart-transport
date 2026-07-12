import Button from '../common/Button'

export default function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange?.(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange?.(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
