import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function RolePermissionsPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Role Permissions"
      description={`Permission settings for role ID: ${id}`}
    />
  )
}
