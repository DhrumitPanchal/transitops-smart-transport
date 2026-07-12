import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function TripEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Trip"
      description={`Edit form for trip ID: ${id}`}
    />
  )
}
