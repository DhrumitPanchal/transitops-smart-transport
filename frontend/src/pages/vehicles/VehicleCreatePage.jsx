import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import VehicleForm from '../../features/vehicles/VehicleForm'
import { useCreateVehicle } from '../../hooks/vehicles'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_VEHICLE_FORM_VALUES } from '../../features/vehicles/vehicleFormDefaults'
import { buildPath } from '../../utils/helpers'

export default function VehicleCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateVehicle()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const vehicle = response?.data
    toast.success('Vehicle created successfully')
    navigate(
      vehicle?.id
        ? buildPath(ROUTES.VEHICLE_DETAIL, { id: vehicle.id })
        : ROUTES.VEHICLES,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add vehicle"
        description="Register a new fleet vehicle for operations."
      />
      <VehicleForm
        defaultValues={DEFAULT_VEHICLE_FORM_VALUES}
        submitLabel="Create vehicle"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.VEHICLES)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
