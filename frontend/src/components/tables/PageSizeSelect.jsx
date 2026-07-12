import { PAGE_SIZES } from '../../constants/appConstants'

export default function PageSizeSelect({
  value,
  onChange,
  options = PAGE_SIZES,
  label = 'Rows',
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-teal-600"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  )
}
