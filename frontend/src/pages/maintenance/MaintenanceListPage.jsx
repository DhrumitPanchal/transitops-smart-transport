import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function MaintenanceListPage() {
  return (
    <PlaceholderPage
      title="Maintenance"
      description="Track vehicle maintenance schedules and history."
      createPermission={PERMISSIONS.MAINTENANCE_CREATE}
      createTo={ROUTES.MAINTENANCE_NEW}
      createLabel="Add maintenance"
    />
  )
}
