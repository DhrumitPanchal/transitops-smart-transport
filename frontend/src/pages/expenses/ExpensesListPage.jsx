import PlaceholderPage from '../../components/common/PlaceholderPage'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'

export default function ExpensesListPage() {
  return (
    <PlaceholderPage
      title="Expenses"
      description="Track operational expenses and approvals."
      createPermission={PERMISSIONS.EXPENSES_CREATE}
      createTo={ROUTES.EXPENSES_NEW}
      createLabel="Add expense"
    />
  )
}
