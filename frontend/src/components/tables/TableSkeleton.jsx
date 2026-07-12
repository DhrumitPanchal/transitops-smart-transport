export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="animate-pulse">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, index) => (
              <div
                key={`head-${index}`}
                className="h-4 flex-1 rounded bg-slate-200"
              />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="border-b border-slate-100 px-4 py-4 last:border-b-0"
          >
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((__, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-4 flex-1 rounded bg-slate-100"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
