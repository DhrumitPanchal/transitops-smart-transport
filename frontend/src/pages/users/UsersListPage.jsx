import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function UsersListPage() {
  return (
    <PlaceholderPage
      title="Users"
      description="Manage application users and access."
      createPermission={PERMISSIONS.USERS_CREATE}
      createTo={ROUTES.ADMIN_USERS_NEW}
      createLabel="Add user"
    />
  )
}
