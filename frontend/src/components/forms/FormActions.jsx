import { cn } from '../../utils/helpers'
import Button from '../common/Button'

export default function FormActions({
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
    >
      {children}
      {onCancel ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      ) : null}
      <Button type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  )
}
