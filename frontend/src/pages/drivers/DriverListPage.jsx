import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import DriverFilters from '../../features/drivers/DriverFilters'
import DriverTable from '../../features/drivers/DriverTable'
import ChangeDriverStatusDialog from '../../features/drivers/ChangeDriverStatusDialog'
import SuspendDriverDialog from '../../features/drivers/SuspendDriverDialog'
import {
  useDrivers,
  useChangeDriverStatus,
  useSuspendDriver,
} from '../../hooks/drivers'
import { getDriverErrorMessage } from '../../features/drivers/driverErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_PAGE_SIZE } from '../../constants/appConstants'
import { useDisclosure } from '../../hooks/useDisclosure'

const INITIAL_FILTERS = {
  search: '',
  status: '',
  licenseCategory: '',
  licenseCondition: '',
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'name',
    sortDirection: filters.sortDirection || 'asc',
  }

  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.status) params.status = filters.status
  if (filters.licenseCategory) params.licenseCategory = filters.licenseCategory
  if (filters.licenseCondition) {
    params.licenseCondition = filters.licenseCondition
  }

  return params
}

export default function DriverListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [suspendError, setSuspendError] = useState(null)
  const statusDialog = useDisclosure()
  const suspendDialog = useDisclosure()
  const changeStatusMutation = useChangeDriverStatus()
  const suspendMutation = useSuspendDriver()

  const queryParams = useMemo(() => cleanParams(filters), [filters])
  const driversQuery = useDrivers(queryParams)

  const rows = driversQuery.data?.data || []
  const pagination = driversQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  const handleSortChange = (columnKey) => {
    setFilters((prev) => {
      if (prev.sortBy === columnKey) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
          page: 1,
        }
      }

      return {
        ...prev,
        sortBy: columnKey,
        sortDirection: 'asc',
        page: 1,
      }
    })
  }

  const openStatusDialog = (driver) => {
    setSelectedDriver(driver)
    setStatusError(null)
    statusDialog.open()
  }

  const openSuspendDialog = (driver) => {
    setSelectedDriver(driver)
    setSuspendError(null)
    suspendDialog.open()
  }

  const handleChangeStatus = async (status) => {
    if (!selectedDriver || changeStatusMutation.isPending) return

    try {
      await changeStatusMutation.mutateAsync({
        id: selectedDriver.id,
        status,
      })
      toast.success('Driver status updated')
      statusDialog.close()
      setSelectedDriver(null)
      setStatusError(null)
    } catch (error) {
      setStatusError(getDriverErrorMessage(error))
    }
  }

  const handleSuspend = async () => {
    if (!selectedDriver || suspendMutation.isPending) return

    try {
      await suspendMutation.mutateAsync(selectedDriver.id)
      toast.success('Driver suspended')
      suspendDialog.close()
      setSelectedDriver(null)
      setSuspendError(null)
    } catch (error) {
      setSuspendError(getDriverErrorMessage(error))
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Drivers"
        description="Manage driver compliance, licence validity, and availability."
        actions={
          <PermissionGate permission={PERMISSIONS.DRIVERS_CREATE}>
            <Link to={ROUTES.DRIVERS_NEW}>
              <Button icon={Plus}>Add driver</Button>
            </Link>
          </PermissionGate>
        }
      />

      <DriverFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      <DriverTable
        rows={rows}
        loading={driversQuery.isLoading}
        error={
          driversQuery.isError
            ? getDriverErrorMessage(driversQuery.error)
            : null
        }
        sortBy={filters.sortBy}
        sortDirection={filters.sortDirection}
        onSortChange={handleSortChange}
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) =>
          setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
        }
        onChangeStatus={openStatusDialog}
        onSuspend={openSuspendDialog}
        emptyAction={
          <PermissionGate permission={PERMISSIONS.DRIVERS_CREATE}>
            <Link to={ROUTES.DRIVERS_NEW}>
              <Button icon={Plus} variant="secondary">
                Add driver
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <ChangeDriverStatusDialog
        open={statusDialog.isOpen}
        driver={selectedDriver}
        loading={changeStatusMutation.isPending}
        errorMessage={statusError}
        onClose={() => {
          if (changeStatusMutation.isPending) return
          statusDialog.close()
          setSelectedDriver(null)
          setStatusError(null)
        }}
        onConfirm={handleChangeStatus}
      />

      <SuspendDriverDialog
        open={suspendDialog.isOpen}
        driver={selectedDriver}
        loading={suspendMutation.isPending}
        errorMessage={suspendError}
        onClose={() => {
          if (suspendMutation.isPending) return
          suspendDialog.close()
          setSelectedDriver(null)
          setSuspendError(null)
        }}
        onConfirm={handleSuspend}
      />
    </PageContainer>
  )
}
