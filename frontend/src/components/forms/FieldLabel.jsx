export default function FieldLabel({ htmlFor, label, required }) {
  if (!label) return null
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {label}
      {required ? <span className="ml-0.5 text-red-600">*</span> : null}
    </label>
  )
}
