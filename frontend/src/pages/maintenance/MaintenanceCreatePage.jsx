import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import MaintenanceForm from '../../features/maintenance/MaintenanceForm'
import { useCreateMaintenance } from '../../hooks/maintenance'
import { unwrapMaintenanceMutationPayload } from '../../features/maintenance/maintenanceQueryCache'
import { DEFAULT_MAINTENANCE_FORM_VALUES } from '../../features/maintenance/maintenanceFormDefaults'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

export default function MaintenanceCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateMaintenance()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const { maintenance } = unwrapMaintenanceMutationPayload(response)
    toast.success('Maintenance scheduled')
    navigate(
      maintenance?.id
        ? buildPath(ROUTES.MAINTENANCE_DETAIL, { id: maintenance.id })
        : ROUTES.MAINTENANCE,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Schedule maintenance"
        description="OPEN or IN_PROGRESS work places the vehicle IN_SHOP and removes it from trip availability."
      />
      <MaintenanceForm
        defaultValues={DEFAULT_MAINTENANCE_FORM_VALUES}
        submitLabel="Schedule maintenance"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.MAINTENANCE)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
