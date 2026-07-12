import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function DriversListPage() {
  return (
    <PlaceholderPage
      title="Drivers"
      description="Manage drivers and license information."
      createPermission={PERMISSIONS.DRIVERS_CREATE}
      createTo={ROUTES.DRIVERS_NEW}
      createLabel="Add driver"
    />
  )
}
