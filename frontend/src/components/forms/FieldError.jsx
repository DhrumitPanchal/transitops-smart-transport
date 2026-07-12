export default function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p id={id} className="mt-1 text-xs text-red-600" role="alert">
      {error}
    </p>
  )
}
