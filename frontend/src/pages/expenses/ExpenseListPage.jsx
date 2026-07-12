import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import ExpenseFilters from '../../features/expenses/ExpenseFilters'
import ExpenseTable from '../../features/expenses/ExpenseTable'
import DeleteExpenseDialog from '../../features/expenses/DeleteExpenseDialog'
import { useExpenses, useDeleteExpense } from '../../hooks/expenses'
import { useVehicles } from '../../hooks/vehicles'
import { useTrips } from '../../hooks/trips'
import { getExpenseErrorMessage } from '../../features/expenses/expenseErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { DEFAULT_PAGE_SIZE } from '../../constants/appConstants'
import { useDisclosure } from '../../hooks/useDisclosure'

const INITIAL_FILTERS = {
  search: '',
  expenseType: '',
  vehicleId: '',
  tripId: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'expenseDate',
  sortDirection: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'expenseDate',
    sortDirection: filters.sortDirection || 'desc',
  }

  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.expenseType) params.expenseType = filters.expenseType
  if (filters.vehicleId) params.vehicleId = filters.vehicleId
  if (filters.tripId) params.tripId = filters.tripId
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo

  return params
}

export default function ExpenseListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [actionError, setActionError] = useState(null)

  const deleteDialog = useDisclosure()
  const deleteMutation = useDeleteExpense()

  const queryParams = useMemo(() => cleanParams(filters), [filters])
  const listQuery = useExpenses(queryParams)
  const vehiclesQuery = useVehicles({
    pageSize: 100,
    sortBy: 'registrationNumber',
  })
  const tripsQuery = useTrips({ pageSize: 100, sortBy: 'createdAt' })

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

  const tripOptions = (tripsQuery.data?.data || []).map((trip) => ({
    value: trip.id,
    label: trip.tripNumber || trip.id,
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

  const openDelete = (record) => {
    setSelectedRecord(record)
    setActionError(null)
    deleteDialog.open()
  }

  const closeDelete = () => {
    if (deleteMutation.isPending) return
    deleteDialog.close()
    setSelectedRecord(null)
    setActionError(null)
  }

  const handleDelete = async () => {
    if (!selectedRecord || deleteMutation.isPending) return
    try {
      await deleteMutation.mutateAsync(selectedRecord.id)
      toast.success('Expense deleted')
      closeDelete()
    } catch (error) {
      setActionError(getExpenseErrorMessage(error))
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description="Track tolls, parking, and other operating costs."
        actions={
          <PermissionGate permission={PERMISSIONS.EXPENSES_CREATE}>
            <Link to={ROUTES.EXPENSES_NEW}>
              <Button icon={Plus}>Add expense</Button>
            </Link>
          </PermissionGate>
        }
      />

      <ExpenseFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        vehicleOptions={vehicleOptions}
        tripOptions={tripOptions}
      />

      <ExpenseTable
        rows={rows}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? getExpenseErrorMessage(listQuery.error) : null
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
        onDelete={openDelete}
        emptyAction={
          <PermissionGate permission={PERMISSIONS.EXPENSES_CREATE}>
            <Link to={ROUTES.EXPENSES_NEW}>
              <Button icon={Plus} variant="secondary">
                Add expense
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <DeleteExpenseDialog
        open={deleteDialog.isOpen}
        expense={selectedRecord}
        loading={deleteMutation.isPending}
        errorMessage={actionError}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </PageContainer>
  )
}
