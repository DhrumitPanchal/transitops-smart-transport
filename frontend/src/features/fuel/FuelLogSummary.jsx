import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
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

export default function FuelLogSummary({ fuelLog }) {
  if (!fuelLog) return null

  const vehicle = fuelLog.vehicle
  const trip = fuelLog.trip

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title="Fuel log details"
          description="Fill-up volume, cost, and station."
        />
        <dl>
          <DetailItem label="Date">{formatDate(fuelLog.fuelDate)}</DetailItem>
          <DetailItem label="Vehicle">
            {vehicle ? (
              <Link
                to={buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id })}
                className="text-teal-700 hover:underline"
              >
                {vehicle.registrationNumber} · {vehicle.vehicleName}
              </Link>
            ) : (
              fuelLog.vehicleRegistration || fuelLog.vehicleId
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
              fuelLog.tripNumber || '—'
            )}
          </DetailItem>
          <DetailItem label="Litres">{formatNumber(fuelLog.liters)}</DetailItem>
          <DetailItem label="Cost">{formatCurrency(fuelLog.cost)}</DetailItem>
          <DetailItem label="Cost per litre">
            {formatCurrency(fuelLog.costPerLitre)}
          </DetailItem>
          <DetailItem label="Odometer">
            {formatNumber(fuelLog.odometerReading)}
          </DetailItem>
          <DetailItem label="Station">
            {fuelLog.stationName || '—'}
          </DetailItem>
          <DetailItem label="Notes">{fuelLog.notes || '—'}</DetailItem>
        </dl>
      </Card>

      <Card>
        <SectionTitle title="Record" description="Timestamps." />
        <dl>
          <DetailItem label="Created">
            {formatDateTime(fuelLog.createdAt)}
          </DetailItem>
          <DetailItem label="Updated">
            {formatDateTime(fuelLog.updatedAt)}
          </DetailItem>
        </dl>
      </Card>
    </div>
  )
}
