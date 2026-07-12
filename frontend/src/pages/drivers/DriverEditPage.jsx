import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import DriverForm from '../../features/drivers/DriverForm'
import { useDriver, useUpdateDriver } from '../../hooks/drivers'
import { getDriverErrorMessage } from '../../features/drivers/driverErrors'
import { ROUTES } from '../../constants/routes'
import { DRIVER_STATUS } from '../../constants/statuses'
import { DRIVER_FORM_STATUSES } from '../../constants/formOptions'
import { buildPath } from '../../utils/helpers'

function toFormValues(driver) {
  const lockStatus = driver.status === DRIVER_STATUS.ON_TRIP

  return {
    name: driver.name || '',
    licenseNumber: driver.licenseNumber || '',
    licenseCategory: driver.licenseCategory || '',
    licenseExpiryDate: driver.licenseExpiryDate || '',
    contactNumber: driver.contactNumber || '',
    safetyScore: driver.safetyScore ?? '',
    status: lockStatus
      ? DRIVER_STATUS.AVAILABLE
      : DRIVER_FORM_STATUSES.includes(driver.status)
        ? driver.status
        : DRIVER_STATUS.AVAILABLE,
  }
}

export default function DriverEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const driverQuery = useDriver(id)
  const updateMutation = useUpdateDriver()

  const driver = driverQuery.data?.data
  const lockStatus = driver?.status === DRIVER_STATUS.ON_TRIP

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('Driver updated successfully')
    navigate(buildPath(ROUTES.DRIVER_DETAIL, { id }), { replace: true })
  }

  if (driverQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit driver" description="Loading driver..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (driverQuery.isError || !driver) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit driver" />
        <ErrorState
          title="Unable to load driver"
          description={getDriverErrorMessage(driverQuery.error)}
          onRetry={() => driverQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Edit driver"
        description={`Update details for ${driver.name}.`}
      />
      <DriverForm
        key={driver.id}
        defaultValues={toFormValues(driver)}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        lockStatus={lockStatus}
        lockedStatusValue={driver.status}
        onCancel={() =>
          navigate(buildPath(ROUTES.DRIVER_DETAIL, { id: driver.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
