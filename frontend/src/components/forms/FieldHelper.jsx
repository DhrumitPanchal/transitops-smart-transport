export default function FieldHelper({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1 text-xs text-slate-500">
      {children}
    </p>
  )
}
