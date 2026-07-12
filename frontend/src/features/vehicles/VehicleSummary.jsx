import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import SectionTitle from '../../components/common/SectionTitle'
import { VEHICLE_TYPE_LABELS } from '../../constants/appConstants'
import { ROUTES } from '../../constants/routes'
import { buildPath, getStatusLabel } from '../../utils/helpers'
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

export default function VehicleSummary({ vehicle }) {
  if (!vehicle) return null

  const hasRelated =
    vehicle.tripCount != null ||
    vehicle.maintenanceCount != null ||
    vehicle.totalFuelCost != null ||
    vehicle.totalExpenseCost != null ||
    vehicle.activeTrip ||
    vehicle.activeMaintenance

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title="Vehicle information"
          description="Core fleet asset details."
        />
        <dl>
          <DetailItem label="Registration number">
            {vehicle.registrationNumber}
          </DetailItem>
          <DetailItem label="Vehicle name">{vehicle.vehicleName}</DetailItem>
          <DetailItem label="Model">{vehicle.model}</DetailItem>
          <DetailItem label="Vehicle type">
            {VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
          </DetailItem>
          <DetailItem label="Maximum capacity">
            {formatWeight(vehicle.maxLoadCapacity, 'kg')}
          </DetailItem>
          <DetailItem label="Current odometer">
            {formatDistance(vehicle.odometer, 'km')}
          </DetailItem>
          <DetailItem label="Acquisition cost">
            {formatCurrency(vehicle.acquisitionCost)}
          </DetailItem>
          <DetailItem label="Region">{vehicle.region}</DetailItem>
          <DetailItem label="Current status">
            <StatusBadge status={vehicle.status} />
          </DetailItem>
          <DetailItem label="Created date">
            {formatDateTime(vehicle.createdAt)}
          </DetailItem>
          <DetailItem label="Updated date">
            {formatDateTime(vehicle.updatedAt)}
          </DetailItem>
        </dl>
      </Card>

      {hasRelated ? (
        <Card>
          <SectionTitle
            title="Related activity"
            description="Summary data included with this vehicle."
          />
          <dl>
            {vehicle.tripCount != null ? (
              <DetailItem label="Trip count">{vehicle.tripCount}</DetailItem>
            ) : null}
            <DetailItem label="Active trip">
              {vehicle.activeTrip ? (
                <Link
                  to={buildPath(ROUTES.TRIP_DETAIL, {
                    id: vehicle.activeTrip.id,
                  })}
                  className="text-teal-700 hover:underline"
                >
                  {vehicle.activeTrip.source} → {vehicle.activeTrip.destination}{' '}
                  ({getStatusLabel(vehicle.activeTrip.status)})
                </Link>
              ) : (
                'None'
              )}
            </DetailItem>
            {vehicle.maintenanceCount != null ? (
              <DetailItem label="Maintenance count">
                {vehicle.maintenanceCount}
              </DetailItem>
            ) : null}
            <DetailItem label="Active maintenance">
              {vehicle.activeMaintenance ? (
                <Link
                  to={buildPath(ROUTES.MAINTENANCE_DETAIL, {
                    id: vehicle.activeMaintenance.id,
                  })}
                  className="text-teal-700 hover:underline"
                >
                  {vehicle.activeMaintenance.maintenanceType} (
                  {getStatusLabel(vehicle.activeMaintenance.status)})
                </Link>
              ) : (
                'None'
              )}
            </DetailItem>
            {vehicle.totalFuelCost != null ? (
              <DetailItem label="Total fuel cost">
                {formatCurrency(vehicle.totalFuelCost)}
              </DetailItem>
            ) : null}
            {vehicle.totalExpenseCost != null ? (
              <DetailItem label="Total expense cost">
                {formatCurrency(vehicle.totalExpenseCost)}
              </DetailItem>
            ) : null}
          </dl>
        </Card>
      ) : null}
    </div>
  )
}
