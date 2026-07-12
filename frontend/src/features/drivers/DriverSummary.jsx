import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import Badge from '../../components/common/Badge'
import SectionTitle from '../../components/common/SectionTitle'
import { LICENCE_CATEGORY_LABELS } from '../../constants/appConstants'
import { ROUTES } from '../../constants/routes'
import { buildPath, getStatusLabel } from '../../utils/helpers'
import { formatDate, formatDateTime } from '../../utils/formatters'
import {
  getLicenseCondition,
  LICENSE_CONDITION_LABELS,
  LICENSE_CONDITIONS,
} from './doesDriverMatchFilters'

const CONDITION_TONES = {
  [LICENSE_CONDITIONS.VALID]: 'green',
  [LICENSE_CONDITIONS.EXPIRING_SOON]: 'amber',
  [LICENSE_CONDITIONS.EXPIRED]: 'red',
}

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

export default function DriverSummary({ driver }) {
  if (!driver) return null

  const condition = getLicenseCondition(driver.licenseExpiryDate)
  const trips = Array.isArray(driver.trips) ? driver.trips : []

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          title="Driver information"
          description="Identity, contact, and licence details."
        />
        <dl>
          <DetailItem label="Name">{driver.name}</DetailItem>
          <DetailItem label="Contact">{driver.contactNumber}</DetailItem>
          <DetailItem label="Licence number">{driver.licenseNumber}</DetailItem>
          <DetailItem label="Licence category">
            {LICENCE_CATEGORY_LABELS[driver.licenseCategory] ||
              driver.licenseCategory}
          </DetailItem>
          <DetailItem label="Licence expiry">
            {formatDate(driver.licenseExpiryDate)}
          </DetailItem>
          <DetailItem label="Licence validity">
            <Badge tone={CONDITION_TONES[condition] || 'slate'}>
              {LICENSE_CONDITION_LABELS[condition]}
            </Badge>
          </DetailItem>
          <DetailItem label="Safety score">{driver.safetyScore}</DetailItem>
          <DetailItem label="Current status">
            <StatusBadge status={driver.status} />
          </DetailItem>
          <DetailItem label="Created">{formatDateTime(driver.createdAt)}</DetailItem>
          <DetailItem label="Updated">
            {formatDateTime(driver.updatedAt)}
          </DetailItem>
        </dl>
      </Card>

      <Card>
        <SectionTitle
          title="Trip history"
          description={
            driver.tripCount != null
              ? `${driver.tripCount} trip${driver.tripCount === 1 ? '' : 's'} linked to this driver.`
              : 'Trips linked to this driver.'
          }
        />
        {trips.length === 0 ? (
          <p className="text-sm text-slate-500">No trips recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="rounded-lg border border-slate-100 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={buildPath(ROUTES.TRIP_DETAIL, { id: trip.id })}
                      className="text-sm font-medium text-teal-700 hover:underline"
                    >
                      {trip.source} → {trip.destination}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(trip.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {getStatusLabel(trip.status)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
