import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import InlineAlert from '../../components/feedback/InlineAlert'
import MaintenanceForm from '../../features/maintenance/MaintenanceForm'
import {
  useMaintenance,
  useUpdateMaintenance,
} from '../../hooks/maintenance'
import { getMaintenanceErrorMessage } from '../../features/maintenance/maintenanceErrors'
import { ROUTES } from '../../constants/routes'
import { MAINTENANCE_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'

function toFormValues(record) {
  return {
    vehicleId: record.vehicleId || '',
    maintenanceType: record.maintenanceType || '',
    description: record.description || '',
    startDate: record.startDate || '',
    expectedEndDate: record.expectedEndDate || '',
    cost: record.cost ?? '',
    vendorName: record.vendorName || '',
    notes: record.notes || '',
    status: record.status || MAINTENANCE_STATUS.OPEN,
  }
}

export default function MaintenanceEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const maintenanceQuery = useMaintenance(id)
  const updateMutation = useUpdateMaintenance()

  const record = maintenanceQuery.data?.data

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('Maintenance updated')
    navigate(buildPath(ROUTES.MAINTENANCE_DETAIL, { id }), { replace: true })
  }

  if (maintenanceQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit maintenance" description="Loading..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (maintenanceQuery.isError || !record) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit maintenance" />
        <ErrorState
          title="Unable to load maintenance"
          description={getMaintenanceErrorMessage(maintenanceQuery.error)}
          onRetry={() => maintenanceQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const isEditable =
    record.status === MAINTENANCE_STATUS.OPEN ||
    record.status === MAINTENANCE_STATUS.IN_PROGRESS

  if (!isEditable) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit maintenance" />
        <InlineAlert tone="warning" title="Locked">
          Completed or cancelled maintenance cannot be edited. This record is{' '}
          {record.status}.
        </InlineAlert>
        <div className="mt-4">
          <button
            type="button"
            className="text-sm text-teal-700 hover:underline"
            onClick={() =>
              navigate(buildPath(ROUTES.MAINTENANCE_DETAIL, { id: record.id }))
            }
          >
            View maintenance details
          </button>
        </div>
      </PageContainer>
    )
  }

  const vehicleLabel =
    record.vehicleRegistration ||
    record.vehicle?.registrationNumber ||
    record.vehicleId

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Edit maintenance"
        description={`Update work for ${vehicleLabel}.`}
      />
      <MaintenanceForm
        key={record.id}
        defaultValues={toFormValues(record)}
        submitLabel="Save changes"
        lockVehicle
        isSubmitting={updateMutation.isPending}
        onCancel={() =>
          navigate(buildPath(ROUTES.MAINTENANCE_DETAIL, { id: record.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
