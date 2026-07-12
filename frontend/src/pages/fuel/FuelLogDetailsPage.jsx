import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import FuelLogSummary from '../../features/fuel/FuelLogSummary'
import DeleteFuelLogDialog from '../../features/fuel/DeleteFuelLogDialog'
import { useFuelLog, useDeleteFuelLog } from '../../hooks/fuel'
import { getFuelLogErrorMessage } from '../../features/fuel/fuelErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'
import { formatDate } from '../../utils/formatters'
import { useDisclosure } from '../../hooks/useDisclosure'

export default function FuelLogDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fuelQuery = useFuelLog(id)
  const deleteMutation = useDeleteFuelLog()
  const deleteDialog = useDisclosure()
  const [actionError, setActionError] = useState(null)

  const record = fuelQuery.data?.data

  const handleDelete = async () => {
    if (!record || deleteMutation.isPending) return
    try {
      await deleteMutation.mutateAsync(record.id)
      toast.success('Fuel log deleted')
      navigate(ROUTES.FUEL, { replace: true })
    } catch (error) {
      setActionError(getFuelLogErrorMessage(error))
    }
  }

  if (fuelQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Fuel log details" description="Loading..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (fuelQuery.isError || !record) {
    return (
      <PageContainer>
        <PageHeader title="Fuel log details" />
        <ErrorState
          title="Unable to load fuel log"
          description={getFuelLogErrorMessage(fuelQuery.error)}
          onRetry={() => fuelQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const vehicleLabel =
    record.vehicleRegistration ||
    record.vehicle?.registrationNumber ||
    record.vehicleId

  return (
    <PageContainer>
      <PageHeader
        title={vehicleLabel}
        description={`Fuel on ${formatDate(record.fuelDate)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.FUEL_EDIT}>
              <Link to={buildPath(ROUTES.FUEL_EDIT, { id: record.id })}>
                <Button variant="secondary" icon={Pencil}>
                  Edit
                </Button>
              </Link>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.FUEL_DELETE}>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  setActionError(null)
                  deleteDialog.open()
                }}
              >
                Delete
              </Button>
            </PermissionGate>
            <Button variant="secondary" onClick={() => navigate(ROUTES.FUEL)}>
              Back to list
            </Button>
          </div>
        }
      />

      <FuelLogSummary fuelLog={record} />

      <DeleteFuelLogDialog
        open={deleteDialog.isOpen}
        fuelLog={record}
        loading={deleteMutation.isPending}
        errorMessage={actionError}
        onClose={() => {
          if (deleteMutation.isPending) return
          deleteDialog.close()
          setActionError(null)
        }}
        onConfirm={handleDelete}
      />
    </PageContainer>
  )
}
