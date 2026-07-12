import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import FieldError from './FieldError'
import FieldHelper from './FieldHelper'
import FieldLabel from './FieldLabel'
import {
  buildDescribedBy,
  getFieldIds,
  inputClassName,
} from './fieldUtils'

export default function PasswordField({
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
  ...props
}) {
  const [visible, setVisible] = useState(false)
  const { fieldId, errorId, helperId } = getFieldIds(name, id)
  const describedBy = buildDescribedBy({ error, helperText, errorId, helperId })

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <div className="relative">
        <input
          id={fieldId}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputClassName(error, `pr-10 ${className || ''}`)}
          {...registration}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError id={errorId} error={error} />
      <FieldHelper id={helperId}>{helperText}</FieldHelper>
    </div>
  )
}
