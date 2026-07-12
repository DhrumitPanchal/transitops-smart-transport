import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function UserEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit User"
      description={`Edit form for user ID: ${id}`}
    />
  )
}
