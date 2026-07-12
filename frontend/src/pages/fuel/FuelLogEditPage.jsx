import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import FuelLogForm from '../../features/fuel/FuelLogForm'
import { useFuelLog, useUpdateFuelLog } from '../../hooks/fuel'
import { getFuelLogErrorMessage } from '../../features/fuel/fuelErrors'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

function toFormValues(record) {
  return {
    vehicleId: record.vehicleId || '',
    tripId: record.tripId || '',
    liters: record.liters ?? '',
    cost: record.cost ?? '',
    fuelDate: record.fuelDate || '',
    odometerReading: record.odometerReading ?? '',
    stationName: record.stationName || '',
    notes: record.notes || '',
  }
}

export default function FuelLogEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fuelQuery = useFuelLog(id)
  const updateMutation = useUpdateFuelLog()

  const record = fuelQuery.data?.data

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('Fuel log updated')
    navigate(buildPath(ROUTES.FUEL_DETAIL, { id }), { replace: true })
  }

  if (fuelQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit fuel log" description="Loading..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (fuelQuery.isError || !record) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit fuel log" />
        <ErrorState
          title="Unable to load fuel log"
          description={getFuelLogErrorMessage(fuelQuery.error)}
          onRetry={() => fuelQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Edit fuel log"
        description={`Update fill-up for ${
          record.vehicleRegistration || record.vehicleId
        }.`}
      />
      <FuelLogForm
        key={record.id}
        defaultValues={toFormValues(record)}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        onCancel={() =>
          navigate(buildPath(ROUTES.FUEL_DETAIL, { id: record.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
