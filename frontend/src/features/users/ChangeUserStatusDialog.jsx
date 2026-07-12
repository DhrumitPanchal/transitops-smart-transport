import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'
import { ROLES, ROLE_LABELS } from '../../constants/roles'
import { USER_STATUS } from '../../constants/statuses'

export default function ChangeUserStatusDialog({
  open,
  user,
  currentUserId,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const nextStatus =
    user?.status === USER_STATUS.ACTIVE
      ? USER_STATUS.INACTIVE
      : USER_STATUS.ACTIVE

  const isSelfSuperAdmin =
    user &&
    currentUserId &&
    String(user.id) === String(currentUserId) &&
    user.role === ROLES.SUPER_ADMIN &&
    nextStatus === USER_STATUS.INACTIVE

  const activating = nextStatus === USER_STATUS.ACTIVE

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={activating ? 'Activate user' : 'Deactivate user'}
      message={
        <div className="space-y-3">
          <p>
            {user ? (
              <>
                {activating ? 'Activate' : 'Deactivate'}{' '}
                <strong>{user.name}</strong> (
                {ROLE_LABELS[user.role] || user.role})?
              </>
            ) : (
              'Change this user status?'
            )}
          </p>
          <p>
            Users are never permanently deleted. Inactive accounts cannot sign
            in.
          </p>
          {isSelfSuperAdmin ? (
            <InlineAlert tone="warning" title="Not allowed">
              Current Super Admin cannot deactivate their own account.
            </InlineAlert>
          ) : null}
          {errorMessage ? (
            <InlineAlert tone="error" title="Unable to change status">
              {errorMessage}
            </InlineAlert>
          ) : null}
        </div>
      }
      confirmLabel={activating ? 'Activate' : 'Deactivate'}
      cancelLabel="Cancel"
      variant={activating ? 'primary' : 'danger'}
      loading={loading}
      confirmDisabled={isSelfSuperAdmin}
    />
  )
}
