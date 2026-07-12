import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import UserForm from '../../features/users/UserForm'
import { useUser, useUpdateUser } from '../../hooks/users'
import { useAuth } from '../../hooks/useAuth'
import { getUserErrorMessage } from '../../features/users/userErrors'
import { ROLES } from '../../constants/roles'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

function toFormValues(user) {
  return {
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    status: user.status || '',
  }
}

export default function UserEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const userQuery = useUser(id)
  const updateMutation = useUpdateUser()

  const record = userQuery.data?.data

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('User updated')
    navigate(buildPath(ROUTES.ADMIN_USER_DETAIL, { id }), { replace: true })
  }

  if (userQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit user" description="Loading..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (userQuery.isError || !record) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit user" />
        <ErrorState
          title="Unable to load user"
          description={getUserErrorMessage(userQuery.error)}
          onRetry={() => userQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const lockSelfDeactivate =
    String(record.id) === String(currentUser?.id) &&
    record.role === ROLES.SUPER_ADMIN

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Edit user" description={`Update ${record.name}.`} />
      <UserForm
        key={record.id}
        mode="edit"
        defaultValues={toFormValues(record)}
        lockSelfDeactivate={lockSelfDeactivate}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        onCancel={() =>
          navigate(buildPath(ROUTES.ADMIN_USER_DETAIL, { id: record.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
