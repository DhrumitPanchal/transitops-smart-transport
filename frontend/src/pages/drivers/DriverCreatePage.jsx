import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import DriverForm from '../../features/drivers/DriverForm'
import { useCreateDriver } from '../../hooks/drivers'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_DRIVER_FORM_VALUES } from '../../features/drivers/driverFormDefaults'
import { buildPath } from '../../utils/helpers'

export default function DriverCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateDriver()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const driver = response?.data
    toast.success('Driver created successfully')
    navigate(
      driver?.id
        ? buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id })
        : ROUTES.DRIVERS,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add driver"
        description="Register a new driver for fleet operations."
      />
      <DriverForm
        defaultValues={DEFAULT_DRIVER_FORM_VALUES}
        submitLabel="Create driver"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.DRIVERS)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
