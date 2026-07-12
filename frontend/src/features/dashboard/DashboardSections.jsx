import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import StatusBadge from '../../components/common/StatusBadge'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'
import { formatCurrency, formatDate } from '../../utils/formatters'

function EmptyRow({ message }) {
  return <p className="py-4 text-sm text-slate-500">{message}</p>
}

export function RecentTripsSection({ trips = [] }) {
  return (
    <Card>
      <SectionTitle
        title="Recent trips"
        description="Latest trip activity across the fleet."
      />
      {trips.length === 0 ? (
        <EmptyRow message="No recent trips." />
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  to={buildPath(ROUTES.TRIP_DETAIL, { id: trip.id })}
                  className="font-medium text-teal-700 hover:underline"
                >
                  {trip.tripNumber || trip.id}
                </Link>
                <p className="text-sm text-slate-500">
                  {trip.source} → {trip.destination}
                </p>
                <p className="text-xs text-slate-400">
                  {trip.vehicleRegistration || '—'} · {trip.driverName || '—'}
                </p>
              </div>
              <StatusBadge status={trip.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function ExpiringLicencesSection({ drivers = [], title = 'Expiring driver licences' }) {
  return (
    <Card>
      <SectionTitle
        title={title}
        description="Licences needing attention within 30 days."
      />
      {drivers.length === 0 ? (
        <EmptyRow message="No licences expiring soon." />
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {drivers.map((driver) => (
            <li
              key={driver.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  to={buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id })}
                  className="font-medium text-teal-700 hover:underline"
                >
                  {driver.name}
                </Link>
                <p className="text-sm text-slate-500">
                  {driver.licenseNumber} · expires{' '}
                  {formatDate(driver.licenseExpiryDate)}
                </p>
              </div>
              <StatusBadge status={driver.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function VehiclesInMaintenanceSection({ records = [] }) {
  return (
    <Card>
      <SectionTitle
        title="Vehicles in maintenance"
        description="Open and in-progress shop work."
      />
      {records.length === 0 ? (
        <EmptyRow message="No vehicles currently in maintenance." />
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  to={buildPath(ROUTES.MAINTENANCE_DETAIL, { id: record.id })}
                  className="font-medium text-teal-700 hover:underline"
                >
                  {record.vehicleRegistration || record.vehicleId}
                </Link>
                <p className="text-sm text-slate-500">{record.description}</p>
              </div>
              <StatusBadge status={record.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function SafetyFocusSection({
  expired = [],
  suspended = [],
  averageSafetyScore,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <SectionTitle
          title="Expired licences"
          description="Drivers with expired licences."
        />
        {expired.length === 0 ? (
          <EmptyRow message="No expired licences." />
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {expired.map((driver) => (
              <li key={driver.id} className="py-3">
                <Link
                  to={buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id })}
                  className="font-medium text-teal-700 hover:underline"
                >
                  {driver.name}
                </Link>
                <p className="text-sm text-slate-500">
                  Expired {formatDate(driver.licenseExpiryDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <SectionTitle
          title="Suspended drivers"
          description={`Fleet average safety score: ${averageSafetyScore ?? '—'}`}
        />
        {suspended.length === 0 ? (
          <EmptyRow message="No suspended drivers." />
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {suspended.map((driver) => (
              <li key={driver.id} className="py-3">
                <Link
                  to={buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id })}
                  className="font-medium text-teal-700 hover:underline"
                >
                  {driver.name}
                </Link>
                <p className="text-sm text-slate-500">
                  Safety score {driver.safetyScore ?? '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export function FinancialFocusSection({ kpis = {} }) {
  const rows = [
    { label: 'Fuel cost', value: formatCurrency(kpis.fuelCost) },
    { label: 'Maintenance cost', value: formatCurrency(kpis.maintenanceCost) },
    { label: 'Other expenses', value: formatCurrency(kpis.expenses) },
    {
      label: 'Operational cost',
      value: formatCurrency(kpis.totalOperationalCost),
    },
    { label: 'Revenue', value: formatCurrency(kpis.revenue) },
    { label: 'Vehicle ROI', value: `${kpis.vehicleRoi ?? 0}%` },
    {
      label: 'Fuel efficiency',
      value: `${kpis.fuelEfficiency ?? 0} km/L`,
    },
  ]

  return (
    <Card>
      <SectionTitle
        title="Financial snapshot"
        description="Cost, revenue, and efficiency indicators."
      />
      <dl className="mt-3 divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-3"
          >
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="text-sm font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
