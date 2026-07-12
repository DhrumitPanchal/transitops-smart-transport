import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function VehicleEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Vehicle"
      description={`Edit form for vehicle ID: ${id}`}
    />
  )
}
