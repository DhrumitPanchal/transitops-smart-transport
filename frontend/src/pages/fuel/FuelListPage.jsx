import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function FuelListPage() {
  return (
    <PlaceholderPage
      title="Fuel Logs"
      description="Record and review fuel consumption."
      createPermission={PERMISSIONS.FUEL_CREATE}
      createTo={ROUTES.FUEL_NEW}
      createLabel="Add fuel log"
    />
  )
}
