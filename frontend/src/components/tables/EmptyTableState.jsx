export default function EmptyTableState({
  title = 'No records found',
  description = 'Try adjusting filters or create a new record.',
  action,
}) {
  return (
    <div className="px-4 py-12 text-center">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
