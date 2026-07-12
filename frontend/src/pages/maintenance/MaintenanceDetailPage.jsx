import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function MaintenanceDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Maintenance Details"
      description={`Details for maintenance ID: ${id}`}
    />
  )
}
