import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function TripDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Trip Details"
      description={`Details for trip ID: ${id}`}
    />
  )
}
