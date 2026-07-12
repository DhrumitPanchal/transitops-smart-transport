import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function UserDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="User Details"
      description={`Details for user ID: ${id}`}
    />
  )
}
