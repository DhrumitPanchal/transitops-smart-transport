export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {description || 'This page is a placeholder and will be implemented next.'}
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-400">
        Content coming soon
      </div>
    </div>
  )
}
