import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import SectionTitle from '../../components/common/SectionTitle'
import { ROUTES } from '../../constants/routes'
import { MAINTENANCE_TYPE_LABELS } from '../../constants/appConstants'
import { buildPath } from '../../utils/helpers'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

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

export default function MaintenanceSummary({ maintenance }) {
  if (!maintenance) return null

  const vehicle = maintenance.vehicle
  const scheduledDate = maintenance.scheduledDate || maintenance.startDate
  const completedDate = maintenance.completedDate || maintenance.completionDate
  const estimatedCost = maintenance.estimatedCost ?? maintenance.cost
  const actualCost = maintenance.actualCost ?? maintenance.finalCost
  const serviceCenter = maintenance.serviceCenter || maintenance.vendorName
  const remarks = maintenance.remarks || maintenance.notes

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title="Maintenance details"
          description="Schedule, cost, and service center information."
        />
        <dl>
          <DetailItem label="Status">
            <StatusBadge status={maintenance.status} />
          </DetailItem>
          <DetailItem label="Title">{maintenance.title || '—'}</DetailItem>
          <DetailItem label="Vehicle">
            {vehicle ? (
              <Link
                to={buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id })}
                className="text-teal-700 hover:underline"
              >
                {vehicle.registrationNumber} · {vehicle.vehicleName}
              </Link>
            ) : (
              maintenance.vehicleRegistration || maintenance.vehicleId
            )}
          </DetailItem>
          <DetailItem label="Type">
            {MAINTENANCE_TYPE_LABELS[maintenance.maintenanceType] ||
              maintenance.maintenanceType}
          </DetailItem>
          <DetailItem label="Description">
            {maintenance.description || '—'}
          </DetailItem>
          <DetailItem label="Scheduled date">
            {formatDate(scheduledDate)}
          </DetailItem>
          <DetailItem label="Completed date">
            {formatDate(completedDate)}
          </DetailItem>
          <DetailItem label="Estimated cost">
            {formatCurrency(estimatedCost)}
          </DetailItem>
          <DetailItem label="Actual cost">
            {formatCurrency(actualCost)}
          </DetailItem>
          <DetailItem label="Service center">{serviceCenter || '—'}</DetailItem>
          <DetailItem label="Current odometer">
            {maintenance.currentOdometer ?? '—'}
          </DetailItem>
          <DetailItem label="Next service odometer">
            {maintenance.nextServiceOdometer ?? '—'}
          </DetailItem>
          <DetailItem label="Remarks">{remarks || '—'}</DetailItem>
        </dl>
      </Card>

      <Card>
        <SectionTitle title="Timeline" description="Record activity." />
        <ul className="mt-2 space-y-0">
          <li className="relative border-l border-slate-200 pl-4 pb-4">
            <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-teal-600" />
            <p className="text-sm font-medium text-slate-800">Created</p>
            <p className="text-xs text-slate-500">
              {formatDateTime(maintenance.createdAt)}
            </p>
          </li>
          <li className="relative border-l border-slate-200 pl-4 pb-4">
            <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-slate-300" />
            <p className="text-sm font-medium text-slate-800">Updated</p>
            <p className="text-xs text-slate-500">
              {formatDateTime(maintenance.updatedAt)}
            </p>
          </li>
          {completedDate ? (
            <li className="relative border-l border-slate-200 pl-4 pb-0">
              <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-slate-300" />
              <p className="text-sm font-medium text-slate-800">Completed</p>
              <p className="text-xs text-slate-500">
                {formatDateTime(completedDate)}
              </p>
            </li>
          ) : null}
        </ul>
      </Card>
    </div>
  )
}
