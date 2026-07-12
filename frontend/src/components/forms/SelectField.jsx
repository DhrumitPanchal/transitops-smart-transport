import FieldError from './FieldError'
import FieldHelper from './FieldHelper'
import FieldLabel from './FieldLabel'
import {
  buildDescribedBy,
  getFieldIds,
  inputClassName,
} from './fieldUtils'

export default function SelectField({
  name,
  id,
  label,
  required = false,
  placeholder = 'Select an option',
  disabled = false,
  readOnly = false,
  error,
  helperText,
  options = [],
  className,
  registration,
  ...props
}) {
  const { fieldId, errorId, helperId } = getFieldIds(name, id)
  const describedBy = buildDescribedBy({ error, helperText, errorId, helperId })

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <select
        id={fieldId}
        name={name}
        disabled={disabled || readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={inputClassName(error, className)}
        {...registration}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} error={error} />
      <FieldHelper id={helperId}>{helperText}</FieldHelper>
    </div>
  )
}
