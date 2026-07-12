import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function VehiclesListPage() {
  return (
    <PlaceholderPage
      title="Vehicles"
      description="Manage fleet vehicles and their operational status."
      createPermission={PERMISSIONS.VEHICLES_CREATE}
      createTo={ROUTES.VEHICLES_NEW}
      createLabel="Add vehicle"
    />
  )
}
