import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import SelectField from '../../components/forms/SelectField'
import InlineAlert from '../../components/feedback/InlineAlert'
import { ROLE_OPTIONS, ROLES } from '../../constants/roles'
import { VALIDATION_MESSAGES } from '../../constants/validationMessages'
import { oneOfEnum } from '../../validations/common'
import { applyApiFieldErrors } from '../../features/users/userErrors'

const approveSchema = z.object({
  role: oneOfEnum(Object.values(ROLES), 'Select a valid role.'),
})

export default function ApproveUserDialog({
  open,
  user,
  currentUserId,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(approveSchema),
    defaultValues: { role: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ role: '' })
      clearErrors()
    }
  }, [open, reset, clearErrors, user?.id])

  if (!user) return null

  const isSelf = String(user.id) === String(currentUserId)

  const submit = handleSubmit(async (values) => {
    if (loading || isSelf) return
    clearErrors('root')
    try {
      await onConfirm?.(values)
    } catch (error) {
      applyApiFieldErrors(setError, error)
      setError('root', {
        message: error?.message || VALIDATION_MESSAGES.INVALID,
      })
    }
  })

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title="Approve user"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={loading}
            disabled={loading || isSelf}
          >
            Approve account
          </Button>
        </div>
      }
    >
      {isSelf ? (
        <InlineAlert tone="error" title="Action not allowed">
          You cannot approve your own account.
        </InlineAlert>
      ) : (
        <>
          <p className="mb-1 text-sm text-slate-600">
            Assign an operational role to <strong>{user.name}</strong>.
          </p>
          <p className="mb-4 text-sm text-slate-600">
            Approving this account will activate the user and grant access
            according to the selected role.
          </p>

          {(errorMessage || errors.root?.message) && (
            <div className="mb-4">
              <InlineAlert tone="error" title="Unable to approve">
                {errorMessage || errors.root?.message}
              </InlineAlert>
            </div>
          )}

          <SelectField
            name="role"
            label="Role"
            required
            disabled={loading}
            registration={register('role')}
            error={errors.role?.message}
            options={ROLE_OPTIONS}
            placeholder="Select a role"
          />
        </>
      )}
    </Modal>
  )
}
