import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Ban, Pencil, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import DriverSummary from '../../features/drivers/DriverSummary'
import ChangeDriverStatusDialog from '../../features/drivers/ChangeDriverStatusDialog'
import SuspendDriverDialog from '../../features/drivers/SuspendDriverDialog'
import {
  useDriver,
  useChangeDriverStatus,
  useSuspendDriver,
} from '../../hooks/drivers'
import { getDriverErrorMessage } from '../../features/drivers/driverErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { DRIVER_STATUS } from '../../constants/statuses'
import { buildPath } from '../../utils/helpers'
import { useDisclosure } from '../../hooks/useDisclosure'

export default function DriverDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const driverQuery = useDriver(id)
  const changeStatusMutation = useChangeDriverStatus()
  const suspendMutation = useSuspendDriver()
  const statusDialog = useDisclosure()
  const suspendDialog = useDisclosure()
  const [statusError, setStatusError] = useState(null)
  const [suspendError, setSuspendError] = useState(null)

  const driver = driverQuery.data?.data
  const canSuspend =
    driver &&
    driver.status !== DRIVER_STATUS.ON_TRIP &&
    driver.status !== DRIVER_STATUS.SUSPENDED
  const canChangeStatus = driver && driver.status !== DRIVER_STATUS.ON_TRIP

  const handleChangeStatus = async (status) => {
    if (!driver || changeStatusMutation.isPending) return

    try {
      await changeStatusMutation.mutateAsync({ id: driver.id, status })
      toast.success('Driver status updated')
      statusDialog.close()
      setStatusError(null)
    } catch (error) {
      setStatusError(getDriverErrorMessage(error))
    }
  }

  const handleSuspend = async () => {
    if (!driver || suspendMutation.isPending) return

    try {
      await suspendMutation.mutateAsync(driver.id)
      toast.success('Driver suspended')
      suspendDialog.close()
      setSuspendError(null)
    } catch (error) {
      setSuspendError(getDriverErrorMessage(error))
    }
  }

  if (driverQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Driver details" description="Loading driver..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (driverQuery.isError || !driver) {
    return (
      <PageContainer>
        <PageHeader title="Driver details" />
        <ErrorState
          title="Unable to load driver"
          description={getDriverErrorMessage(driverQuery.error)}
          onRetry={() => driverQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={driver.name}
        description={driver.licenseNumber}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.DRIVERS_EDIT}>
              <Link to={buildPath(ROUTES.DRIVER_EDIT, { id: driver.id })}>
                <Button variant="secondary" icon={Pencil}>
                  Edit
                </Button>
              </Link>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.DRIVERS_CHANGE_STATUS}>
              <Button
                variant="secondary"
                icon={RefreshCw}
                disabled={!canChangeStatus}
                onClick={() => {
                  setStatusError(null)
                  statusDialog.open()
                }}
              >
                Change status
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.DRIVERS_SUSPEND}>
              <Button
                variant="danger"
                icon={Ban}
                disabled={!canSuspend}
                onClick={() => {
                  setSuspendError(null)
                  suspendDialog.open()
                }}
              >
                Suspend
              </Button>
            </PermissionGate>
            <Button variant="secondary" onClick={() => navigate(ROUTES.DRIVERS)}>
              Back to list
            </Button>
          </div>
        }
      />

      <DriverSummary driver={driver} />

      <ChangeDriverStatusDialog
        open={statusDialog.isOpen}
        driver={driver}
        loading={changeStatusMutation.isPending}
        errorMessage={statusError}
        onClose={() => {
          if (changeStatusMutation.isPending) return
          statusDialog.close()
          setStatusError(null)
        }}
        onConfirm={handleChangeStatus}
      />

      <SuspendDriverDialog
        open={suspendDialog.isOpen}
        driver={driver}
        loading={suspendMutation.isPending}
        errorMessage={suspendError}
        onClose={() => {
          if (suspendMutation.isPending) return
          suspendDialog.close()
          setSuspendError(null)
        }}
        onConfirm={handleSuspend}
      />
    </PageContainer>
  )
}
