import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import ExpenseForm from '../../features/expenses/ExpenseForm'
import { useExpense, useUpdateExpense } from '../../hooks/expenses'
import { getExpenseErrorMessage } from '../../features/expenses/expenseErrors'
import { EXPENSE_TYPE_LABELS } from '../../constants/appConstants'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

function toFormValues(record) {
  return {
    vehicleId: record.vehicleId || '',
    tripId: record.tripId || '',
    expenseType: record.expenseType || '',
    amount: record.amount ?? '',
    expenseDate: record.expenseDate || '',
    description: record.description || '',
  }
}

export default function ExpenseEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const expenseQuery = useExpense(id)
  const updateMutation = useUpdateExpense()

  const record = expenseQuery.data?.data

  const handleSubmit = async (values) => {
    await updateMutation.mutateAsync({ id, payload: values })
    toast.success('Expense updated')
    navigate(buildPath(ROUTES.EXPENSE_DETAIL, { id }), { replace: true })
  }

  if (expenseQuery.isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit expense" description="Loading..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (expenseQuery.isError || !record) {
    return (
      <PageContainer maxWidth="lg">
        <PageHeader title="Edit expense" />
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
    <PageContainer maxWidth="lg">
      <PageHeader title="Edit expense" description={`Update ${typeLabel}.`} />
      <ExpenseForm
        key={record.id}
        defaultValues={toFormValues(record)}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        onCancel={() =>
          navigate(buildPath(ROUTES.EXPENSE_DETAIL, { id: record.id }))
        }
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
