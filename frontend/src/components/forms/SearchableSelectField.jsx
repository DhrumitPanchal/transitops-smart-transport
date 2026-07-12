import { useMemo, useState } from 'react'
import FieldError from './FieldError'
import FieldHelper from './FieldHelper'
import FieldLabel from './FieldLabel'
import {
  buildDescribedBy,
  getFieldIds,
  inputClassName,
} from './fieldUtils'

export default function SearchableSelectField({
  name,
  id,
  label,
  required = false,
  placeholder = 'Search and select',
  disabled = false,
  readOnly = false,
  error,
  helperText,
  options = [],
  value,
  onChange,
  className,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { fieldId, errorId, helperId } = getFieldIds(name, id)
  const describedBy = buildDescribedBy({ error, helperText, errorId, helperId })

  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) =>
      String(option.label).toLowerCase().includes(term),
    )
  }, [options, query])

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div className="relative">
        <input
          id={fieldId}
          name={name}
          type="text"
          disabled={disabled}
          readOnly={readOnly}
          placeholder={selected?.label || placeholder}
          value={open ? query : selected?.label || ''}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-expanded={open}
          aria-autocomplete="list"
          className={inputClassName(error, className)}
          onFocus={() => {
            if (!readOnly && !disabled) {
              setOpen(true)
              setQuery('')
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150)
          }}
        />
        {open ? (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No results</li>
            ) : (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      onChange?.(option.value)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      <FieldError id={errorId} error={error} />
      <FieldHelper id={helperId}>{helperText}</FieldHelper>
    </div>
  )
}
