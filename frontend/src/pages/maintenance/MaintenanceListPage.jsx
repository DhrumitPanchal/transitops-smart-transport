import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import MaintenanceFilters from '../../features/maintenance/MaintenanceFilters'
import MaintenanceTable from '../../features/maintenance/MaintenanceTable'
import CompleteMaintenanceDialog from '../../features/maintenance/CompleteMaintenanceDialog'
import CancelMaintenanceDialog from '../../features/maintenance/CancelMaintenanceDialog'
import {
  useMaintenanceList,
  useCompleteMaintenance,
  useCancelMaintenance,
} from '../../hooks/maintenance'
import { useVehicles } from '../../hooks/vehicles'
import { getMaintenanceErrorMessage } from '../../features/maintenance/maintenanceErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_PAGE_SIZE } from '../../constants/appConstants'
import { useDisclosure } from '../../hooks/useDisclosure'

const INITIAL_FILTERS = {
  search: '',
  status: '',
  maintenanceType: '',
  vehicleId: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'createdAt',
    sortDirection: filters.sortDirection || 'desc',
  }

  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.status) params.status = filters.status
  if (filters.maintenanceType) params.maintenanceType = filters.maintenanceType
  if (filters.vehicleId) params.vehicleId = filters.vehicleId
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo

  return params
}

export default function MaintenanceListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [actionError, setActionError] = useState(null)

  const completeDialog = useDisclosure()
  const cancelDialog = useDisclosure()

  const completeMutation = useCompleteMaintenance()
  const cancelMutation = useCancelMaintenance()

  const queryParams = useMemo(() => cleanParams(filters), [filters])
  const listQuery = useMaintenanceList(queryParams)
  const vehiclesQuery = useVehicles({
    pageSize: 100,
    sortBy: 'registrationNumber',
  })

  const rows = listQuery.data?.data || []
  const pagination = listQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  const vehicleOptions = (vehiclesQuery.data?.data || []).map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
  }))

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

  const openAction = (dialog, record) => {
    setSelectedRecord(record)
    setActionError(null)
    dialog.open()
  }

  const closeAction = (dialog, mutation) => {
    if (mutation.isPending) return
    dialog.close()
    setSelectedRecord(null)
    setActionError(null)
  }

  const handleComplete = async (values) => {
    if (!selectedRecord || completeMutation.isPending) return
    await completeMutation.mutateAsync({
      id: selectedRecord.id,
      payload: values,
    })
    toast.success('Maintenance completed')
    closeAction(completeDialog, completeMutation)
  }

  const handleCancel = async (values) => {
    if (!selectedRecord || cancelMutation.isPending) return
    await cancelMutation.mutateAsync({
      id: selectedRecord.id,
      payload: values,
    })
    toast.success('Maintenance cancelled')
    closeAction(cancelDialog, cancelMutation)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Maintenance"
        description="Schedule shop work and restore vehicle availability when complete."
        actions={
          <PermissionGate permission={PERMISSIONS.MAINTENANCE_CREATE}>
            <Link to={ROUTES.MAINTENANCE_NEW}>
              <Button icon={Plus}>Schedule maintenance</Button>
            </Link>
          </PermissionGate>
        }
      />

      <MaintenanceFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        vehicleOptions={vehicleOptions}
      />

      <MaintenanceTable
        rows={rows}
        loading={listQuery.isLoading}
        error={
          listQuery.isError
            ? getMaintenanceErrorMessage(listQuery.error)
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
        onComplete={(record) => openAction(completeDialog, record)}
        onCancel={(record) => openAction(cancelDialog, record)}
        emptyAction={
          <PermissionGate permission={PERMISSIONS.MAINTENANCE_CREATE}>
            <Link to={ROUTES.MAINTENANCE_NEW}>
              <Button icon={Plus} variant="secondary">
                Schedule maintenance
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <CompleteMaintenanceDialog
        open={completeDialog.isOpen}
        maintenance={selectedRecord}
        loading={completeMutation.isPending}
        errorMessage={actionError}
        onClose={() => closeAction(completeDialog, completeMutation)}
        onConfirm={handleComplete}
      />

      <CancelMaintenanceDialog
        open={cancelDialog.isOpen}
        maintenance={selectedRecord}
        loading={cancelMutation.isPending}
        errorMessage={actionError}
        onClose={() => closeAction(cancelDialog, cancelMutation)}
        onConfirm={handleCancel}
      />
    </PageContainer>
  )
}
