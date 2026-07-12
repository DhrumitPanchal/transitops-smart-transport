import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Ban, CheckCircle2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import MaintenanceSummary from '../../features/maintenance/MaintenanceSummary'
import CompleteMaintenanceDialog from '../../features/maintenance/CompleteMaintenanceDialog'
import CancelMaintenanceDialog from '../../features/maintenance/CancelMaintenanceDialog'
import {
  useMaintenance,
  useCompleteMaintenance,
  useCancelMaintenance,
} from '../../hooks/maintenance'
import { getMaintenanceErrorMessage } from '../../features/maintenance/maintenanceErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { MAINTENANCE_STATUS } from '../../constants/statuses'
import { MAINTENANCE_TYPE_LABELS } from '../../constants/appConstants'
import { buildPath } from '../../utils/helpers'
import { useDisclosure } from '../../hooks/useDisclosure'

export default function MaintenanceDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const maintenanceQuery = useMaintenance(id)
  const completeMutation = useCompleteMaintenance()
  const cancelMutation = useCancelMaintenance()

  const completeDialog = useDisclosure()
  const cancelDialog = useDisclosure()
  const [actionError, setActionError] = useState(null)

  const record = maintenanceQuery.data?.data
  const isActive =
    record?.status === MAINTENANCE_STATUS.OPEN ||
    record?.status === MAINTENANCE_STATUS.IN_PROGRESS

  const handleComplete = async (values) => {
    if (!record || completeMutation.isPending) return
    await completeMutation.mutateAsync({ id: record.id, payload: values })
    toast.success('Maintenance completed')
    completeDialog.close()
    setActionError(null)
  }

  const handleCancel = async (values) => {
    if (!record || cancelMutation.isPending) return
    await cancelMutation.mutateAsync({ id: record.id, payload: values })
    toast.success('Maintenance cancelled')
    cancelDialog.close()
    setActionError(null)
  }

  if (maintenanceQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Maintenance details" description="Loading..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (maintenanceQuery.isError || !record) {
    return (
      <PageContainer>
        <PageHeader title="Maintenance details" />
        <ErrorState
          title="Unable to load maintenance"
          description={getMaintenanceErrorMessage(maintenanceQuery.error)}
          onRetry={() => maintenanceQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const vehicleLabel =
    record.vehicleRegistration ||
    record.vehicle?.registrationNumber ||
    record.vehicleId
  const typeLabel =
    MAINTENANCE_TYPE_LABELS[record.maintenanceType] || record.maintenanceType

  return (
    <PageContainer>
      <PageHeader
        title={typeLabel}
        description={vehicleLabel}
        actions={
          <div className="flex flex-wrap gap-2">
            {isActive ? (
              <PermissionGate permission={PERMISSIONS.MAINTENANCE_EDIT}>
                <Link to={buildPath(ROUTES.MAINTENANCE_EDIT, { id: record.id })}>
                  <Button variant="secondary" icon={Pencil}>
                    Edit
                  </Button>
                </Link>
              </PermissionGate>
            ) : null}

            {isActive ? (
              <PermissionGate permission={PERMISSIONS.MAINTENANCE_COMPLETE}>
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

            {isActive ? (
              <PermissionGate permission={PERMISSIONS.MAINTENANCE_CANCEL}>
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

            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.MAINTENANCE)}
            >
              Back to list
            </Button>
          </div>
        }
      />

      <MaintenanceSummary maintenance={record} />

      <CompleteMaintenanceDialog
        open={completeDialog.isOpen}
        maintenance={record}
        loading={completeMutation.isPending}
        errorMessage={actionError}
        onClose={() => {
          if (completeMutation.isPending) return
          completeDialog.close()
          setActionError(null)
        }}
        onConfirm={handleComplete}
      />

      <CancelMaintenanceDialog
        open={cancelDialog.isOpen}
        maintenance={record}
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
