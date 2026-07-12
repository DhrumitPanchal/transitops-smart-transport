import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import { ROUTES } from '../../constants/routes'
import { EXPENSE_TYPE_LABELS } from '../../constants/appConstants'
import { buildPath } from '../../utils/helpers'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../utils/formatters'

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

export default function ExpenseSummary({ expense }) {
  if (!expense) return null

  const vehicle = expense.vehicle
  const trip = expense.trip

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title="Expense details"
          description="Type, amount, and linked resources."
        />
        <dl>
          <DetailItem label="Date">{formatDate(expense.expenseDate)}</DetailItem>
          <DetailItem label="Type">
            {EXPENSE_TYPE_LABELS[expense.expenseType] || expense.expenseType}
          </DetailItem>
          <DetailItem label="Amount">
            {formatCurrency(expense.amount)}
          </DetailItem>
          <DetailItem label="Description">
            {expense.description || '—'}
          </DetailItem>
          <DetailItem label="Vehicle">
            {vehicle ? (
              <Link
                to={buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id })}
                className="text-teal-700 hover:underline"
              >
                {vehicle.registrationNumber} · {vehicle.vehicleName}
              </Link>
            ) : (
              expense.vehicleRegistration || expense.vehicleId || '—'
            )}
          </DetailItem>
          <DetailItem label="Trip">
            {trip ? (
              <Link
                to={buildPath(ROUTES.TRIP_DETAIL, { id: trip.id })}
                className="text-teal-700 hover:underline"
              >
                {trip.tripNumber || trip.id}
              </Link>
            ) : (
              expense.tripNumber || '—'
            )}
          </DetailItem>
        </dl>
      </Card>

      <Card>
        <SectionTitle title="Record" description="Timestamps." />
        <dl>
          <DetailItem label="Created">
            {formatDateTime(expense.createdAt)}
          </DetailItem>
          <DetailItem label="Updated">
            {formatDateTime(expense.updatedAt)}
          </DetailItem>
        </dl>
      </Card>
    </div>
  )
}
