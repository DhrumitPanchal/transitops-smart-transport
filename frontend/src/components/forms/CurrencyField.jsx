import { CURRENCY_SYMBOL } from '../../constants/appConstants'
import FieldError from './FieldError'
import FieldHelper from './FieldHelper'
import FieldLabel from './FieldLabel'
import {
  buildDescribedBy,
  getFieldIds,
  inputClassName,
} from './fieldUtils'

export default function CurrencyField({
  name,
  id,
  label,
  required = false,
  placeholder,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  className,
  registration,
  currencySymbol = CURRENCY_SYMBOL,
  ...props
}) {
  const { fieldId, errorId, helperId } = getFieldIds(name, id)
  const describedBy = buildDescribedBy({ error, helperText, errorId, helperId })

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">
          {currencySymbol}
        </span>
        <input
          id={fieldId}
          name={name}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputClassName(error, `pl-8 ${className || ''}`)}
          {...registration}
          {...props}
        />
      </div>
      <FieldError id={errorId} error={error} />
      <FieldHelper id={helperId}>{helperText}</FieldHelper>
    </div>
  )
}
