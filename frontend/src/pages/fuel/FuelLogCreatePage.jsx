import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import FuelLogForm from '../../features/fuel/FuelLogForm'
import { useCreateFuelLog } from '../../hooks/fuel'
import { unwrapFuelLogResponse } from '../../features/fuel/fuelQueryCache'
import { DEFAULT_FUEL_LOG_FORM_VALUES } from '../../features/fuel/fuelFormDefaults'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

export default function FuelLogCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateFuelLog()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const record = unwrapFuelLogResponse(response)
    toast.success('Fuel log created')
    navigate(
      record?.id
        ? buildPath(ROUTES.FUEL_DETAIL, { id: record.id })
        : ROUTES.FUEL,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add fuel log"
        description="Record litres, cost, and odometer for a vehicle fill-up."
      />
      <FuelLogForm
        defaultValues={DEFAULT_FUEL_LOG_FORM_VALUES}
        submitLabel="Create fuel log"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.FUEL)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
