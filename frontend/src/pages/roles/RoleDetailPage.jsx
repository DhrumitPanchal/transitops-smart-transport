import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function RoleDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Role Details"
      description={`Details for role ID: ${id}`}
    />
  )
}
