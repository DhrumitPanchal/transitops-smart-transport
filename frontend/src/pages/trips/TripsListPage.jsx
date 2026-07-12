import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function TripsListPage() {
  return (
    <PlaceholderPage
      title="Trips"
      description="Schedule and track trip operations."
      createPermission={PERMISSIONS.TRIPS_CREATE}
      createTo={ROUTES.TRIPS_NEW}
      createLabel="Create trip"
    />
  )
}
