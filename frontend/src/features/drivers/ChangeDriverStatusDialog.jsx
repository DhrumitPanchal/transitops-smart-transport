import { useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import SelectField from '../../components/forms/SelectField'
import InlineAlert from '../../components/feedback/InlineAlert'
import { DRIVER_STATUS } from '../../constants/statuses'
import { DRIVER_CHANGE_STATUS_OPTIONS } from './driverFormDefaults'

function getInitialStatus(driver) {
  if (driver?.status === DRIVER_STATUS.OFF_DUTY) {
    return DRIVER_STATUS.OFF_DUTY
  }
  return DRIVER_STATUS.AVAILABLE
}

export default function ChangeDriverStatusDialog({
  open,
  driver,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const blocked = driver?.status === DRIVER_STATUS.ON_TRIP
  const dialogKey = `${driver?.id || 'none'}-${open ? 'open' : 'closed'}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change driver status"
      size="sm"
      footer={null}
    >
      <ChangeDriverStatusForm
        key={dialogKey}
        driver={driver}
        blocked={blocked}
        loading={loading}
        errorMessage={errorMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}

function ChangeDriverStatusForm({
  driver,
  blocked,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}) {
  const [status, setStatus] = useState(() => getInitialStatus(driver))

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {driver ? (
          <>
            Update status for <strong>{driver.name}</strong> (
            {driver.licenseNumber}).
          </>
        ) : (
          'Update driver status.'
        )}
      </p>

      {blocked ? (
        <InlineAlert tone="warning" title="Unavailable">
          ON_TRIP drivers cannot have their status changed manually. Complete or
          cancel the trip first.
        </InlineAlert>
      ) : (
        <SelectField
          name="status"
          label="New status"
          required
          options={DRIVER_CHANGE_STATUS_OPTIONS}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          helperText="Use Suspend for disciplinary holds. ON_TRIP is set by trips."
        />
      )}

      {errorMessage ? (
        <InlineAlert tone="error" title="Unable to update status">
          {errorMessage}
        </InlineAlert>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm?.(status)}
          loading={loading}
          disabled={loading || blocked || !status}
        >
          Update status
        </Button>
      </div>
    </div>
  )
}
