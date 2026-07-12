import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import VehicleForm from '../../features/vehicles/VehicleForm'
import { useVehicle, useUpdateVehicle } from '../../hooks/vehicles'
import { getVehicleErrorMessage } from '../../features/vehicles/vehicleErrors'
import { ROUTES } from '../../constants/routes'
import { VEHICLE_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'

function toFormValues(vehicle) {
  const isLifecycleStatus =
    vehicle.status === VEHICLE_STATUS.ON_TRIP ||
    vehicle.status === VEHICLE_STATUS.IN_SHOP

  return {
    registrationNumber: vehicle.registrationNumber || '',
    vehicleName: vehicle.vehicleName || '',
    model: vehicle.model || '',
    vehicleType: vehicle.vehicleType || '',
    maxLoadCapacity: vehicle.maxLoadCapacity ?? '',
    odometer: vehicle.odometer ?? '',
    acquisitionCost: vehicle.acquisitionCost ?? '',
    region: vehicle.region || '',
    status: isLifecycleStatus
      ? VEHICLE_STATUS.AVAILABLE
      : vehicle.status || VEHICLE_STATUS.AVAILABLE,
  }
}

export default function VehicleEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vehicleQuery = useVehicle(id)
  const updateMutation = useUpdateVehicle()

  const vehicle = vehicleQuery.data?.data
  const lockStatus =
    vehicle?.status === VEHICLE_STATUS.ON_TRIP ||
    vehicle?.status === VEHICLE_STATUS.IN_SHOP

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('Vehicle updated successfully')
    navigate(buildPath(ROUTES.VEHICLE_DETAIL, { id }), { replace: true })
  }

  if (vehicleQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit vehicle" description="Loading vehicle..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit vehicle" />
        <ErrorState
          title="Unable to load vehicle"
          description={getVehicleErrorMessage(vehicleQuery.error)}
          onRetry={() => vehicleQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Edit vehicle"
        description={`Update details for ${vehicle.registrationNumber}.`}
      />
      <VehicleForm
        key={vehicle.id}
        defaultValues={toFormValues(vehicle)}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        lockStatus={lockStatus}
        lockedStatusValue={vehicle.status}
        onCancel={() =>
          navigate(buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
