import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function VehicleDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Vehicle Details"
      description={`Details for vehicle ID: ${id}`}
    />
  )
}
