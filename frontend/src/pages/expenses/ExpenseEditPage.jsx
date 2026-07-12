import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function ExpenseEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Expense"
      description={`Edit form for expense ID: ${id}`}
    />
  )
}
