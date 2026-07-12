import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import VehicleFilters from '../../features/vehicles/VehicleFilters'
import VehicleTable from '../../features/vehicles/VehicleTable'
import RetireVehicleDialog from '../../features/vehicles/RetireVehicleDialog'
import { useVehicles, useRetireVehicle } from '../../hooks/vehicles'
import { getVehicleErrorMessage } from '../../features/vehicles/vehicleErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_PAGE_SIZE } from '../../constants/appConstants'
import { useDisclosure } from '../../hooks/useDisclosure'

const INITIAL_FILTERS = {
  search: '',
  vehicleType: '',
  status: '',
  region: '',
  sortBy: 'registrationNumber',
  sortDirection: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'registrationNumber',
    sortDirection: filters.sortDirection || 'asc',
  }

  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.vehicleType) params.vehicleType = filters.vehicleType
  if (filters.status) params.status = filters.status
  if (filters.region) params.region = filters.region

  return params
}

export default function VehicleListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [retireError, setRetireError] = useState(null)
  const retireDialog = useDisclosure()
  const retireMutation = useRetireVehicle()

  const queryParams = useMemo(() => cleanParams(filters), [filters])
  const vehiclesQuery = useVehicles(queryParams)

  const rows = vehiclesQuery.data?.data || []
  const pagination = vehiclesQuery.data?.pagination || {
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

  const openRetireDialog = (vehicle) => {
    setSelectedVehicle(vehicle)
    setRetireError(null)
    retireDialog.open()
  }

  const closeRetireDialog = () => {
    if (retireMutation.isPending) return
    retireDialog.close()
    setSelectedVehicle(null)
    setRetireError(null)
  }

  const handleRetire = async () => {
    if (!selectedVehicle || retireMutation.isPending) return

    try {
      await retireMutation.mutateAsync(selectedVehicle.id)
      toast.success('Vehicle retired successfully')
      closeRetireDialog()
    } catch (error) {
      setRetireError(getVehicleErrorMessage(error))
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Vehicles"
        description="Manage fleet vehicles and their operational status."
        actions={
          <PermissionGate permission={PERMISSIONS.VEHICLES_CREATE}>
            <Link to={ROUTES.VEHICLES_NEW}>
              <Button icon={Plus}>Add vehicle</Button>
            </Link>
          </PermissionGate>
        }
      />

      <VehicleFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      <VehicleTable
        rows={rows}
        loading={vehiclesQuery.isLoading}
        error={
          vehiclesQuery.isError
            ? getVehicleErrorMessage(vehiclesQuery.error)
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
        onRetire={openRetireDialog}
        emptyAction={
          <PermissionGate permission={PERMISSIONS.VEHICLES_CREATE}>
            <Link to={ROUTES.VEHICLES_NEW}>
              <Button icon={Plus} variant="secondary">
                Add vehicle
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <RetireVehicleDialog
        open={retireDialog.isOpen}
        vehicle={selectedVehicle}
        loading={retireMutation.isPending}
        errorMessage={retireError}
        onClose={closeRetireDialog}
        onConfirm={handleRetire}
      />
    </PageContainer>
  )
}
