import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import UserForm from '../../features/users/UserForm'
import { useCreateUser } from '../../hooks/users'
import { unwrapUserResponse } from '../../features/users/userQueryCache'
import { DEFAULT_USER_CREATE_VALUES } from '../../features/users/userFormDefaults'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

export default function UserCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateUser()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const user = unwrapUserResponse(response)
    toast.success('User created')
    navigate(
      user?.id
        ? buildPath(ROUTES.ADMIN_USER_DETAIL, { id: user.id })
        : ROUTES.ADMIN_USERS,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add user"
        description="Password is required on create and is never returned by the API."
      />
      <UserForm
        mode="create"
        defaultValues={DEFAULT_USER_CREATE_VALUES}
        submitLabel="Create user"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.ADMIN_USERS)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
