import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import SectionTitle from '../../components/common/SectionTitle'
import { ROUTES } from '../../constants/routes'
import { TRIP_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import {
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatWeight,
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

function TimelineItem({ label, value, active }) {
  if (!value && !active) return null
  return (
    <li className="relative border-l border-slate-200 pl-4 pb-4 last:pb-0">
      <span
        className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${
          active ? 'bg-teal-600' : 'bg-slate-300'
        }`}
      />
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">{value ? formatDateTime(value) : '—'}</p>
    </li>
  )
}

export default function TripSummary({ trip }) {
  if (!trip) return null

  const vehicle = trip.vehicle
  const driver = trip.driver

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title="Trip details"
          description="Route, resources, and operational metrics."
        />
        <dl>
          <DetailItem label="Trip number">
            {trip.tripNumber || trip.id}
          </DetailItem>
          <DetailItem label="Route">
            {trip.source} → {trip.destination}
          </DetailItem>
          <DetailItem label="Status">
            <StatusBadge status={trip.status} />
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
              trip.vehicleRegistration || trip.vehicleId
            )}
          </DetailItem>
          <DetailItem label="Driver">
            {driver ? (
              <Link
                to={buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id })}
                className="text-teal-700 hover:underline"
              >
                {driver.name}
              </Link>
            ) : (
              trip.driverName || trip.driverId
            )}
          </DetailItem>
          <DetailItem label="Cargo">
            {formatWeight(trip.cargoWeight, 'kg')}
          </DetailItem>
          <DetailItem label="Capacity">
            {formatWeight(
              trip.vehicleCapacity ?? vehicle?.maxLoadCapacity,
              'kg',
            )}
          </DetailItem>
          <DetailItem label="Planned distance">
            {formatDistance(trip.plannedDistance, 'km')}
          </DetailItem>
          <DetailItem label="Start odometer">
            {formatDistance(trip.startOdometer, 'km')}
          </DetailItem>
          <DetailItem label="Final odometer">
            {formatDistance(trip.finalOdometer, 'km')}
          </DetailItem>
          <DetailItem label="Fuel consumed">
            {trip.fuelConsumed != null ? `${trip.fuelConsumed} L` : '—'}
          </DetailItem>
          <DetailItem label="Fuel cost">
            {formatCurrency(trip.fuelCost)}
          </DetailItem>
          <DetailItem label="Revenue">
            {formatCurrency(trip.revenue)}
          </DetailItem>
          {trip.cancelReason ? (
            <DetailItem label="Cancellation reason">
              {trip.cancelReason}
            </DetailItem>
          ) : null}
        </dl>
      </Card>

      <Card>
        <SectionTitle
          title="Status timeline"
          description="Key lifecycle timestamps for this trip."
        />
        <ul className="mt-2">
          <TimelineItem
            label="Created"
            value={trip.createdAt}
            active={Boolean(trip.createdAt)}
          />
          <TimelineItem
            label="Dispatched"
            value={trip.dispatchedAt}
            active={Boolean(trip.dispatchedAt)}
          />
          <TimelineItem
            label="Completed"
            value={trip.completedAt}
            active={trip.status === TRIP_STATUS.COMPLETED}
          />
          <TimelineItem
            label="Cancelled"
            value={trip.cancelledAt}
            active={trip.status === TRIP_STATUS.CANCELLED}
          />
          <TimelineItem
            label="Updated"
            value={trip.updatedAt}
            active={Boolean(trip.updatedAt)}
          />
        </ul>
      </Card>
    </div>
  )
}
