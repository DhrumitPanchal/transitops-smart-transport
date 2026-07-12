import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Ban, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import VehicleSummary from '../../features/vehicles/VehicleSummary'
import RetireVehicleDialog from '../../features/vehicles/RetireVehicleDialog'
import { useVehicle, useRetireVehicle } from '../../hooks/vehicles'
import { getVehicleErrorMessage } from '../../features/vehicles/vehicleErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { VEHICLE_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import { useDisclosure } from '../../hooks/useDisclosure'

export default function VehicleDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vehicleQuery = useVehicle(id)
  const retireMutation = useRetireVehicle()
  const retireDialog = useDisclosure()
  const [retireError, setRetireError] = useState(null)

  const vehicle = vehicleQuery.data?.data
  const canRetire =
    vehicle &&
    vehicle.status !== VEHICLE_STATUS.ON_TRIP &&
    vehicle.status !== VEHICLE_STATUS.RETIRED

  const handleRetire = async () => {
    if (!vehicle || retireMutation.isPending) return

    try {
      await retireMutation.mutateAsync(vehicle.id)
      toast.success('Vehicle retired successfully')
      retireDialog.close()
      setRetireError(null)
    } catch (error) {
      setRetireError(getVehicleErrorMessage(error))
    }
  }

  if (vehicleQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Vehicle details" description="Loading vehicle..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <PageContainer>
        <PageHeader title="Vehicle details" />
        <ErrorState
          title="Unable to load vehicle"
          description={getVehicleErrorMessage(vehicleQuery.error)}
          onRetry={() => vehicleQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={vehicle.registrationNumber}
        description={vehicle.vehicleName}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.VEHICLES_EDIT}>
              <Link to={buildPath(ROUTES.VEHICLE_EDIT, { id: vehicle.id })}>
                <Button variant="secondary" icon={Pencil}>
                  Edit
                </Button>
              </Link>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.VEHICLES_RETIRE}>
              <Button
                variant="danger"
                icon={Ban}
                disabled={!canRetire}
                onClick={() => {
                  setRetireError(null)
                  retireDialog.open()
                }}
              >
                Retire
              </Button>
            </PermissionGate>
            <Button variant="secondary" onClick={() => navigate(ROUTES.VEHICLES)}>
              Back to list
            </Button>
          </div>
        }
      />

      <VehicleSummary vehicle={vehicle} />

      <RetireVehicleDialog
        open={retireDialog.isOpen}
        vehicle={vehicle}
        loading={retireMutation.isPending}
        errorMessage={retireError}
        onClose={() => {
          if (retireMutation.isPending) return
          retireDialog.close()
          setRetireError(null)
        }}
        onConfirm={handleRetire}
      />
    </PageContainer>
  )
}
