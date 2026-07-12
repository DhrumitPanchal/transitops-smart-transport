import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function ExpenseDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Expense Details"
      description={`Details for expense ID: ${id}`}
    />
  )
}
