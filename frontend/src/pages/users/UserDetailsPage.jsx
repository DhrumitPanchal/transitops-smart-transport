import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Pencil, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import ChangeUserStatusDialog from '../../features/users/ChangeUserStatusDialog'
import ApproveUserDialog from './ApproveUserDialog'
import {
  useUser,
  useChangeUserStatus,
  useApproveUser,
} from '../../hooks/users'
import { useAuth } from '../../hooks/useAuth'
import { getUserErrorMessage } from '../../features/users/userErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { USER_STATUS } from '../../constants/statuses'
import { buildPath, getRoleLabel } from '../../utils/helpers'
import { formatDateTime } from '../../utils/formatters'
import { useDisclosure } from '../../hooks/useDisclosure'
import { groupPermissions } from '../../utils/permissionGroups'
import { isMockMode } from '../../services/serviceMode'

function DetailItem({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 sm:text-right">
        {children}
      </dd>
    </div>
  )
}

export default function UserDetailsPage() {
  const mocksEnabled = isMockMode()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const userQuery = useUser(id)
  const statusMutation = useChangeUserStatus()
  const approveMutation = useApproveUser()
  const statusDialog = useDisclosure()
  const approveDialog = useDisclosure()
  const [actionError, setActionError] = useState(null)

  const record = userQuery.data?.data
  const isPending = record?.status === USER_STATUS.PENDING

  const handleStatusChange = async () => {
    if (!record || statusMutation.isPending) return
    const nextStatus =
      record.status === USER_STATUS.INACTIVE
        ? USER_STATUS.ACTIVE
        : USER_STATUS.INACTIVE

    if (record.status === USER_STATUS.PENDING && nextStatus === USER_STATUS.ACTIVE) {
      setActionError('Use Approve to assign a role and activate this account.')
      return
    }

    try {
      await statusMutation.mutateAsync({ id: record.id, status: nextStatus })
      toast.success(
        nextStatus === USER_STATUS.ACTIVE ? 'User activated' : 'User deactivated',
      )
      statusDialog.close()
      setActionError(null)
    } catch (error) {
      setActionError(getUserErrorMessage(error))
    }
  }

  const handleApprove = async (values) => {
    if (!record || approveMutation.isPending) return
    await approveMutation.mutateAsync({
      id: record.id,
      payload: { role: values.role },
    })
    toast.success('User approved successfully.')
    approveDialog.close()
    setActionError(null)
  }

  if (userQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="User details" description="Loading..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (userQuery.isError || !record) {
    return (
      <PageContainer>
        <PageHeader title="User details" />
        <ErrorState
          title="Unable to load user"
          description={getUserErrorMessage(userQuery.error)}
          onRetry={() => userQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const permissionGroups = groupPermissions(record.permissions || [])
  const nextLabel =
    record.status === USER_STATUS.INACTIVE ? 'Activate' : 'Deactivate'

  return (
    <PageContainer>
      <PageHeader
        title={record.name}
        description={record.email}
        actions={
          <div className="flex flex-wrap gap-2">
            {mocksEnabled && isPending ? (
              <PermissionGate permission={PERMISSIONS.USERS_CHANGE_STATUS}>
                <Button
                  icon={CheckCircle2}
                  onClick={() => {
                    setActionError(null)
                    approveDialog.open()
                  }}
                >
                  Approve
                </Button>
              </PermissionGate>
            ) : null}
            {mocksEnabled && !isPending ? (
              <PermissionGate permission={PERMISSIONS.USERS_EDIT}>
                <Link to={buildPath(ROUTES.ADMIN_USER_EDIT, { id: record.id })}>
                  <Button variant="secondary" icon={Pencil}>
                    Edit
                  </Button>
                </Link>
              </PermissionGate>
            ) : null}
            {mocksEnabled ? (
              <PermissionGate permission={PERMISSIONS.USERS_CHANGE_STATUS}>
                <Button
                  variant="secondary"
                  icon={UserCog}
                  onClick={() => {
                    setActionError(null)
                    statusDialog.open()
                  }}
                >
                  {nextLabel}
                </Button>
              </PermissionGate>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
            >
              Back to list
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <SectionTitle title="Profile" />
          <dl>
            <DetailItem label="Name">{record.name}</DetailItem>
            <DetailItem label="Email">{record.email}</DetailItem>
            <DetailItem label="Phone">{record.phone || '—'}</DetailItem>
            <DetailItem label="Role">{getRoleLabel(record.role)}</DetailItem>
            <DetailItem label="Status">
              <StatusBadge status={record.status} />
            </DetailItem>
            <DetailItem label="Last login">
              {record.lastLogin ? formatDateTime(record.lastLogin) : '—'}
            </DetailItem>
            <DetailItem label="Created">
              {formatDateTime(record.createdAt)}
            </DetailItem>
            <DetailItem label="Updated">
              {formatDateTime(record.updatedAt)}
            </DetailItem>
          </dl>
        </Card>

        <Card>
          <SectionTitle
            title="Effective permissions"
            description="Resolved from the assigned role. Passwords are never exposed."
          />
          <div className="mt-3 space-y-4">
            {permissionGroups.length === 0 ? (
              <p className="text-sm text-slate-500">
                {isPending
                  ? 'No permissions until this account is approved.'
                  : 'No permissions on this user payload. Auth session users include permissions.'}
              </p>
            ) : (
              permissionGroups.map((group) => (
                <div key={group.key}>
                  <p className="text-sm font-medium text-slate-800">
                    {group.label}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li
                        key={item.key}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        {item.key}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {mocksEnabled ? (
        <>
          <ChangeUserStatusDialog
            open={statusDialog.isOpen}
            user={record}
            currentUserId={currentUser?.id}
            loading={statusMutation.isPending}
            errorMessage={actionError}
            onClose={() => {
              if (statusMutation.isPending) return
              statusDialog.close()
              setActionError(null)
            }}
            onConfirm={handleStatusChange}
          />

          <ApproveUserDialog
            open={approveDialog.isOpen}
            user={record}
            currentUserId={currentUser?.id}
            loading={approveMutation.isPending}
            errorMessage={actionError}
            onClose={() => {
              if (approveMutation.isPending) return
              approveDialog.close()
              setActionError(null)
            }}
            onConfirm={handleApprove}
          />
        </>
      ) : null}
    </PageContainer>
  )
}
