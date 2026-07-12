import FieldError from './FieldError'
import FieldHelper from './FieldHelper'
import FieldLabel from './FieldLabel'
import {
  buildDescribedBy,
  getFieldIds,
  inputClassName,
} from './fieldUtils'

export default function TextField({
  name,
  id,
  label,
  required = false,
  placeholder,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  type = 'text',
  className,
  registration,
  ...props
}) {
  const { fieldId, errorId, helperId } = getFieldIds(name, id)
  const describedBy = buildDescribedBy({ error, helperText, errorId, helperId })

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <input
        id={fieldId}
        name={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={inputClassName(error, className)}
        {...registration}
        {...props}
      />
      <FieldError id={errorId} error={error} />
      <FieldHelper id={helperId}>{helperText}</FieldHelper>
    </div>
  )
}
