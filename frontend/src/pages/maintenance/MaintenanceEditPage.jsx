import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function MaintenanceEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Maintenance"
      description={`Edit form for maintenance ID: ${id}`}
    />
  )
}
