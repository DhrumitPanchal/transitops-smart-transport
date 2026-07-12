import FieldError from './FieldError'
import FieldHelper from './FieldHelper'
import {
  buildDescribedBy,
  getFieldIds,
} from './fieldUtils'
import { cn } from '../../utils/helpers'

export default function CheckboxField({
  name,
  id,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  className,
  registration,
  ...props
}) {
  const { fieldId, errorId, helperId } = getFieldIds(name, id)
  const describedBy = buildDescribedBy({ error, helperText, errorId, helperId })

  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className={cn('flex items-start gap-3 text-sm text-slate-700', className)}
      >
        <input
          id={fieldId}
          name={name}
          type="checkbox"
          disabled={disabled || readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          {...registration}
          {...props}
        />
        <span>
          {label}
          {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        </span>
      </label>
      <FieldError id={errorId} error={error} />
      <FieldHelper id={helperId}>{helperText}</FieldHelper>
    </div>
  )
}
