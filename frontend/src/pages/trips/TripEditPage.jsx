import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import InlineAlert from '../../components/feedback/InlineAlert'
import TripForm from '../../features/trips/TripForm'
import { useTrip, useUpdateDraftTrip } from '../../hooks/trips'
import { getTripErrorMessage } from '../../features/trips/tripErrors'
import { ROUTES } from '../../constants/routes'
import { TRIP_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'

function toFormValues(trip) {
  return {
    source: trip.source || '',
    destination: trip.destination || '',
    vehicleId: trip.vehicleId || '',
    driverId: trip.driverId || '',
    cargoWeight: trip.cargoWeight ?? '',
    plannedDistance: trip.plannedDistance ?? '',
    revenue: trip.revenue ?? '',
  }
}

export default function TripEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tripQuery = useTrip(id)
  const updateMutation = useUpdateDraftTrip()

  const trip = tripQuery.data?.data

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('Draft trip updated')
    navigate(buildPath(ROUTES.TRIP_DETAIL, { id }), { replace: true })
  }

  if (tripQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit trip" description="Loading trip..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (tripQuery.isError || !trip) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit trip" />
        <ErrorState
          title="Unable to load trip"
          description={getTripErrorMessage(tripQuery.error)}
          onRetry={() => tripQuery.refetch()}
        />
      </PageContainer>
    )
  }

  if (trip.status !== TRIP_STATUS.DRAFT) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit trip" />
        <InlineAlert tone="warning" title="Draft only">
          Only draft trips can be edited. This trip is {trip.status}.
        </InlineAlert>
        <div className="mt-4">
          <button
            type="button"
            className="text-sm text-teal-700 hover:underline"
            onClick={() =>
              navigate(buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }))
            }
          >
            View trip details
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Edit draft trip"
        description={`Update ${trip.tripNumber || trip.id}.`}
      />
      <TripForm
        key={trip.id}
        defaultValues={toFormValues(trip)}
        submitLabel="Save draft"
        isSubmitting={updateMutation.isPending}
        onCancel={() =>
          navigate(buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
