import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Ban, CheckCircle2, Pencil, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import TripSummary from '../../features/trips/TripSummary'
import DispatchTripDialog from '../../features/trips/DispatchTripDialog'
import CompleteTripDialog from '../../features/trips/CompleteTripDialog'
import CancelTripDialog from '../../features/trips/CancelTripDialog'
import {
  useTrip,
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
} from '../../hooks/trips'
import { getTripErrorMessage } from '../../features/trips/tripErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { TRIP_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import { useDisclosure } from '../../hooks/useDisclosure'

export default function TripDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tripQuery = useTrip(id)
  const dispatchMutation = useDispatchTrip()
  const completeMutation = useCompleteTrip()
  const cancelMutation = useCancelTrip()

  const dispatchDialog = useDisclosure()
  const completeDialog = useDisclosure()
  const cancelDialog = useDisclosure()
  const [actionError, setActionError] = useState(null)

  const trip = tripQuery.data?.data
  const isDraft = trip?.status === TRIP_STATUS.DRAFT
  const isDispatched = trip?.status === TRIP_STATUS.DISPATCHED

  const handleDispatch = async () => {
    if (!trip || dispatchMutation.isPending) return
    try {
      await dispatchMutation.mutateAsync(trip.id)
      toast.success('Trip dispatched')
      dispatchDialog.close()
      setActionError(null)
    } catch (error) {
      setActionError(getTripErrorMessage(error))
    }
  }

  const handleComplete = async (values) => {
    if (!trip || completeMutation.isPending) return
    await completeMutation.mutateAsync({ id: trip.id, payload: values })
    toast.success('Trip completed')
    completeDialog.close()
    setActionError(null)
  }

  const handleCancel = async (values) => {
    if (!trip || cancelMutation.isPending) return
    await cancelMutation.mutateAsync({ id: trip.id, payload: values })
    toast.success('Trip cancelled')
    cancelDialog.close()
    setActionError(null)
  }

  if (tripQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Trip details" description="Loading trip..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (tripQuery.isError || !trip) {
    return (
      <PageContainer>
        <PageHeader title="Trip details" />
        <ErrorState
          title="Unable to load trip"
          description={getTripErrorMessage(tripQuery.error)}
          onRetry={() => tripQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={trip.tripNumber || trip.id}
        description={`${trip.source} → ${trip.destination}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {isDraft ? (
              <PermissionGate permission={PERMISSIONS.TRIPS_EDIT_DRAFT}>
                <Link to={buildPath(ROUTES.TRIP_EDIT, { id: trip.id })}>
                  <Button variant="secondary" icon={Pencil}>
                    Edit
                  </Button>
                </Link>
              </PermissionGate>
            ) : null}

            {isDraft ? (
              <PermissionGate permission={PERMISSIONS.TRIPS_DISPATCH}>
                <Button
                  icon={Send}
                  onClick={() => {
                    setActionError(null)
                    dispatchDialog.open()
                  }}
                >
                  Dispatch
                </Button>
              </PermissionGate>
            ) : null}

            {isDispatched ? (
              <PermissionGate permission={PERMISSIONS.TRIPS_COMPLETE}>
                <Button
                  icon={CheckCircle2}
                  onClick={() => {
                    setActionError(null)
                    completeDialog.open()
                  }}
                >
                  Complete
                </Button>
              </PermissionGate>
            ) : null}

            {isDraft || isDispatched ? (
              <PermissionGate permission={PERMISSIONS.TRIPS_CANCEL}>
                <Button
                  variant="danger"
                  icon={Ban}
                  onClick={() => {
                    setActionError(null)
                    cancelDialog.open()
                  }}
                >
                  Cancel
                </Button>
              </PermissionGate>
            ) : null}

            <Button variant="secondary" onClick={() => navigate(ROUTES.TRIPS)}>
              Back to list
            </Button>
          </div>
        }
      />

      <TripSummary trip={trip} />

      <DispatchTripDialog
        open={dispatchDialog.isOpen}
        trip={trip}
        loading={dispatchMutation.isPending}
        errorMessage={actionError}
        onClose={() => {
          if (dispatchMutation.isPending) return
          dispatchDialog.close()
          setActionError(null)
        }}
        onConfirm={handleDispatch}
      />

      <CompleteTripDialog
        open={completeDialog.isOpen}
        trip={trip}
        loading={completeMutation.isPending}
        errorMessage={actionError}
        onClose={() => {
          if (completeMutation.isPending) return
          completeDialog.close()
          setActionError(null)
        }}
        onConfirm={handleComplete}
      />

      <CancelTripDialog
        open={cancelDialog.isOpen}
        trip={trip}
        loading={cancelMutation.isPending}
        errorMessage={actionError}
        onClose={() => {
          if (cancelMutation.isPending) return
          cancelDialog.close()
          setActionError(null)
        }}
        onConfirm={handleCancel}
      />
    </PageContainer>
  )
}
