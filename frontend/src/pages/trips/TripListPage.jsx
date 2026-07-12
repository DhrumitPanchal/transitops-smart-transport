import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import TripFilters from '../../features/trips/TripFilters'
import TripTable from '../../features/trips/TripTable'
import DispatchTripDialog from '../../features/trips/DispatchTripDialog'
import CompleteTripDialog from '../../features/trips/CompleteTripDialog'
import CancelTripDialog from '../../features/trips/CancelTripDialog'
import {
  useTrips,
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
} from '../../hooks/trips'
import { useVehicles } from '../../hooks/vehicles'
import { useDrivers } from '../../hooks/drivers'
import { getTripErrorMessage } from '../../features/trips/tripErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_PAGE_SIZE } from '../../constants/appConstants'
import { useDisclosure } from '../../hooks/useDisclosure'

const INITIAL_FILTERS = {
  search: '',
  status: '',
  vehicleId: '',
  driverId: '',
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
  if (filters.vehicleId) params.vehicleId = filters.vehicleId
  if (filters.driverId) params.driverId = filters.driverId
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo

  return params
}

export default function TripListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [actionError, setActionError] = useState(null)

  const dispatchDialog = useDisclosure()
  const completeDialog = useDisclosure()
  const cancelDialog = useDisclosure()

  const dispatchMutation = useDispatchTrip()
  const completeMutation = useCompleteTrip()
  const cancelMutation = useCancelTrip()

  const queryParams = useMemo(() => cleanParams(filters), [filters])
  const tripsQuery = useTrips(queryParams)
  const vehiclesQuery = useVehicles({ pageSize: 100, sortBy: 'registrationNumber' })
  const driversQuery = useDrivers({ pageSize: 100, sortBy: 'name' })

  const rows = tripsQuery.data?.data || []
  const pagination = tripsQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  const vehicleOptions = (vehiclesQuery.data?.data || []).map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
  }))

  const driverOptions = (driversQuery.data?.data || []).map((driver) => ({
    value: driver.id,
    label: driver.name,
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

  const openAction = (dialog, trip) => {
    setSelectedTrip(trip)
    setActionError(null)
    dialog.open()
  }

  const closeAction = (dialog, mutation) => {
    if (mutation.isPending) return
    dialog.close()
    setSelectedTrip(null)
    setActionError(null)
  }

  const handleDispatch = async () => {
    if (!selectedTrip || dispatchMutation.isPending) return
    try {
      await dispatchMutation.mutateAsync(selectedTrip.id)
      toast.success('Trip dispatched')
      closeAction(dispatchDialog, dispatchMutation)
    } catch (error) {
      setActionError(getTripErrorMessage(error))
    }
  }

  const handleComplete = async (values) => {
    if (!selectedTrip || completeMutation.isPending) return
    await completeMutation.mutateAsync({
      id: selectedTrip.id,
      payload: values,
    })
    toast.success('Trip completed')
    closeAction(completeDialog, completeMutation)
  }

  const handleCancel = async (values) => {
    if (!selectedTrip || cancelMutation.isPending) return
    await cancelMutation.mutateAsync({
      id: selectedTrip.id,
      payload: values,
    })
    toast.success('Trip cancelled')
    closeAction(cancelDialog, cancelMutation)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Trips"
        description="Create, dispatch, complete, and cancel fleet trips."
        actions={
          <PermissionGate permission={PERMISSIONS.TRIPS_CREATE}>
            <Link to={ROUTES.TRIPS_NEW}>
              <Button icon={Plus}>Create trip</Button>
            </Link>
          </PermissionGate>
        }
      />

      <TripFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        vehicleOptions={vehicleOptions}
        driverOptions={driverOptions}
      />

      <TripTable
        rows={rows}
        loading={tripsQuery.isLoading}
        error={
          tripsQuery.isError ? getTripErrorMessage(tripsQuery.error) : null
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
        onDispatch={(trip) => openAction(dispatchDialog, trip)}
        onComplete={(trip) => openAction(completeDialog, trip)}
        onCancel={(trip) => openAction(cancelDialog, trip)}
        emptyAction={
          <PermissionGate permission={PERMISSIONS.TRIPS_CREATE}>
            <Link to={ROUTES.TRIPS_NEW}>
              <Button icon={Plus} variant="secondary">
                Create trip
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <DispatchTripDialog
        open={dispatchDialog.isOpen}
        trip={selectedTrip}
        loading={dispatchMutation.isPending}
        errorMessage={actionError}
        onClose={() => closeAction(dispatchDialog, dispatchMutation)}
        onConfirm={handleDispatch}
      />

      <CompleteTripDialog
        open={completeDialog.isOpen}
        trip={selectedTrip}
        loading={completeMutation.isPending}
        errorMessage={actionError}
        onClose={() => closeAction(completeDialog, completeMutation)}
        onConfirm={handleComplete}
      />

      <CancelTripDialog
        open={cancelDialog.isOpen}
        trip={selectedTrip}
        loading={cancelMutation.isPending}
        errorMessage={actionError}
        onClose={() => closeAction(cancelDialog, cancelMutation)}
        onConfirm={handleCancel}
      />
    </PageContainer>
  )
}
