import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import DateField from '../../components/forms/DateField'
import CurrencyField from '../../components/forms/CurrencyField'
import TextAreaField from '../../components/forms/TextAreaField'
import InlineAlert from '../../components/feedback/InlineAlert'
import { createMaintenanceCompletionSchema } from '../../validations/maintenanceValidation'
import { MAINTENANCE_STATUS } from '../../constants/statuses'
import { applyApiFieldErrors, getMaintenanceErrorMessage } from './maintenanceErrors'

export default function CompleteMaintenanceDialog({
  open,
  maintenance,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const canComplete =
    maintenance?.status === MAINTENANCE_STATUS.OPEN ||
    maintenance?.status === MAINTENANCE_STATUS.IN_PROGRESS
  const dialogKey = `${maintenance?.id || 'none'}-${open ? 'open' : 'closed'}`

  return (
    <Modal open={open} onClose={onClose} title="Complete maintenance" size="md">
      <CompleteMaintenanceForm
        key={dialogKey}
        maintenance={maintenance}
        canComplete={canComplete}
        loading={loading}
        errorMessage={errorMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}

function CompleteMaintenanceForm({
  maintenance,
  canComplete,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}) {
  const schema = useMemo(
    () => createMaintenanceCompletionSchema(maintenance?.startDate),
    [maintenance?.startDate],
  )

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      completionDate: new Date().toISOString().slice(0, 10),
      finalCost: maintenance?.cost ?? '',
      notes: maintenance?.notes || '',
    },
  })

  const [formError, setFormError] = useState(null)

  const onSubmit = handleSubmit(async (values) => {
    if (!canComplete || loading) return
    clearErrors('root')
    setFormError(null)

    try {
      await onConfirm?.(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setFormError(getMaintenanceErrorMessage(error))
    }
  })

  const vehicleLabel =
    maintenance?.vehicleRegistration ||
    maintenance?.vehicle?.registrationNumber ||
    maintenance?.vehicleId

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-slate-600">
        {maintenance ? (
          <>
            Complete maintenance for <strong>{vehicleLabel}</strong>. The
            vehicle returns to AVAILABLE unless retired.
          </>
        ) : (
          'Complete this maintenance record.'
        )}
      </p>

      {!canComplete ? (
        <InlineAlert tone="warning" title="Unavailable">
          Only open or in-progress maintenance can be completed.
        </InlineAlert>
      ) : (
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-4">
          <DateField
            name="completionDate"
            label="Completion date"
            required
            disabled={loading}
            registration={register('completionDate')}
            error={errors.completionDate?.message}
          />
          <CurrencyField
            name="finalCost"
            label="Final cost"
            required
            disabled={loading}
            registration={register('finalCost')}
            error={errors.finalCost?.message}
          />
          <div className="md:col-span-2">
            <TextAreaField
              name="notes"
              label="Notes"
              disabled={loading}
              registration={register('notes')}
              error={errors.notes?.message}
            />
          </div>
        </div>
      )}

      {errorMessage || formError ? (
        <InlineAlert tone="error" title="Unable to complete">
          {errorMessage || formError}
        </InlineAlert>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading || !canComplete}
        >
          Complete maintenance
        </Button>
      </div>
    </form>
  )
}
