import ConfirmDialog from '../../components/common/ConfirmDialog'
import InlineAlert from '../../components/feedback/InlineAlert'
import { EXPENSE_TYPE_LABELS } from '../../constants/appConstants'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function DeleteExpenseDialog({
  open,
  expense,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}) {
  const typeLabel =
    EXPENSE_TYPE_LABELS[expense?.expenseType] || expense?.expenseType

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete expense"
      message={
        <div className="space-y-3">
          <p>
            {expense ? (
              <>
                Delete <strong>{typeLabel}</strong> expense of{' '}
                <strong>{formatCurrency(expense.amount)}</strong> on{' '}
                <strong>{formatDate(expense.expenseDate)}</strong>?
              </>
            ) : (
              'Delete this expense?'
            )}
          </p>
          <p>This permanently removes the record from the expenses list.</p>
          {errorMessage ? (
            <InlineAlert tone="error" title="Unable to delete">
              {errorMessage}
            </InlineAlert>
          ) : null}
        </div>
      }
      confirmLabel="Delete expense"
      cancelLabel="Keep record"
      variant="danger"
      loading={loading}
    />
  )
}
