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
import ExpenseSummary from '../../features/expenses/ExpenseSummary'
import DeleteExpenseDialog from '../../features/expenses/DeleteExpenseDialog'
import { useExpense, useDeleteExpense } from '../../hooks/expenses'
import { getExpenseErrorMessage } from '../../features/expenses/expenseErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { EXPENSE_TYPE_LABELS } from '../../constants/appConstants'
import { buildPath } from '../../utils/helpers'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useDisclosure } from '../../hooks/useDisclosure'

export default function ExpenseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const expenseQuery = useExpense(id)
  const deleteMutation = useDeleteExpense()
  const deleteDialog = useDisclosure()
  const [actionError, setActionError] = useState(null)

  const record = expenseQuery.data?.data

  const handleDelete = async () => {
    if (!record || deleteMutation.isPending) return
    try {
      await deleteMutation.mutateAsync(record.id)
      toast.success('Expense deleted')
      navigate(ROUTES.EXPENSES, { replace: true })
    } catch (error) {
      setActionError(getExpenseErrorMessage(error))
    }
  }

  if (expenseQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Expense details" description="Loading..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (expenseQuery.isError || !record) {
    return (
      <PageContainer>
        <PageHeader title="Expense details" />
        <ErrorState
          title="Unable to load expense"
          description={getExpenseErrorMessage(expenseQuery.error)}
          onRetry={() => expenseQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const typeLabel =
    EXPENSE_TYPE_LABELS[record.expenseType] || record.expenseType

  return (
    <PageContainer>
      <PageHeader
        title={typeLabel}
        description={`${formatCurrency(record.amount)} · ${formatDate(
          record.expenseDate,
        )}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.EXPENSES_EDIT}>
              <Link to={buildPath(ROUTES.EXPENSE_EDIT, { id: record.id })}>
                <Button variant="secondary" icon={Pencil}>
                  Edit
                </Button>
              </Link>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.EXPENSES_DELETE}>
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
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.EXPENSES)}
            >
              Back to list
            </Button>
          </div>
        }
      />

      <ExpenseSummary expense={record} />

      <DeleteExpenseDialog
        open={deleteDialog.isOpen}
        expense={record}
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
