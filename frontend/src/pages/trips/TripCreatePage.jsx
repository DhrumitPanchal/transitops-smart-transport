import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import TripForm from '../../features/trips/TripForm'
import { useCreateTrip } from '../../hooks/trips'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_TRIP_FORM_VALUES } from '../../features/trips/tripFormDefaults'
import { buildPath } from '../../utils/helpers'

export default function TripCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateTrip()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const trip = response?.data
    toast.success('Trip created as draft')
    navigate(
      trip?.id ? buildPath(ROUTES.TRIP_DETAIL, { id: trip.id }) : ROUTES.TRIPS,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Create trip"
        description="Draft a trip using available vehicles and drivers."
      />
      <TripForm
        defaultValues={DEFAULT_TRIP_FORM_VALUES}
        submitLabel="Create draft trip"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.TRIPS)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
