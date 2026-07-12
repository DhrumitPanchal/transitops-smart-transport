import { useMemo, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { getRoleLabel } from '../../utils/helpers'
import { groupPermissions } from '../../utils/permissionGroups'
import { formatDateTime } from '../../utils/formatters'
import { USER_STATUS } from '../../constants/statuses'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import SectionTitle from '../../components/common/SectionTitle'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'

export default function ProfilePage() {
  const { logout, isLoading, isPendingApproval } = useAuth()
  const { user } = useCurrentUser()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const permissionGroups = useMemo(
    () => groupPermissions(user?.permissions || []),
    [user?.permissions],
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setConfirmOpen(false)
    }
  }

  if (!user) {
    return null
  }

  const activeWithoutRole =
    user.status === USER_STATUS.ACTIVE && !user.role

  return (
    <PageContainer>
      <PageHeader
        title="Profile"
        description={
          isPendingApproval
            ? 'Your registration details while waiting for approval.'
            : 'Your account details and assigned permissions.'
        }
        actions={
          <Button
            variant="danger"
            icon={LogOut}
            onClick={() => setConfirmOpen(true)}
            disabled={isLoading || loggingOut}
          >
            Logout
          </Button>
        }
      />

      {isPendingApproval ? (
        <div className="mb-4">
          <InlineAlert tone="warning" title="Waiting for approval">
            A Super Admin must assign a role before you can access operational
            modules.
          </InlineAlert>
        </div>
      ) : null}

      {activeWithoutRole ? (
        <div className="mb-4">
          <InlineAlert tone="warning" title="No role assigned">
            Your account is active but no role has been assigned. Contact the
            administrator.
          </InlineAlert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.name} size="lg" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {user.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge tone="teal">{getRoleLabel(user.role)}</Badge>
              <StatusBadge status={user.status} />
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-800">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-800">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-800">
                {getRoleLabel(user.role)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge status={user.status} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Registered</dt>
              <dd className="font-medium text-slate-800">
                {formatDateTime(user.createdAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <SectionTitle
            title="Permissions"
            description={
              isPendingApproval
                ? 'Permissions are assigned after administrator approval.'
                : 'Grouped access rights for your role.'
            }
          />
          <div className="space-y-5">
            {permissionGroups.length === 0 ? (
              <p className="text-sm text-slate-500">No permissions assigned.</p>
            ) : (
              permissionGroups.map((group) => (
                <div key={group.key}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    {group.label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <Badge key={item.key} tone="slate">
                        {item.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Sign out"
        message="Are you sure you want to sign out of TransitOps?"
        confirmLabel="Logout"
        cancelLabel="Stay signed in"
        variant="danger"
        loading={loggingOut}
      />
    </PageContainer>
  )
}
