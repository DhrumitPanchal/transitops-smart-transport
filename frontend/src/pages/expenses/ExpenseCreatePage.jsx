import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import ExpenseForm from '../../features/expenses/ExpenseForm'
import { useCreateExpense } from '../../hooks/expenses'
import { unwrapExpenseResponse } from '../../features/expenses/expenseQueryCache'
import { DEFAULT_EXPENSE_FORM_VALUES } from '../../features/expenses/expenseFormDefaults'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

export default function ExpenseCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateExpense()

  const handleSubmit = async (values) => {
    const response = await createMutation.mutateAsync(values)
    const record = unwrapExpenseResponse(response)
    toast.success('Expense created')
    navigate(
      record?.id
        ? buildPath(ROUTES.EXPENSE_DETAIL, { id: record.id })
        : ROUTES.EXPENSES,
      { replace: true },
    )
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add expense"
        description="Capture operating costs optionally linked to a vehicle or trip."
      />
      <ExpenseForm
        defaultValues={DEFAULT_EXPENSE_FORM_VALUES}
        submitLabel="Create expense"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(ROUTES.EXPENSES)}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
