import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function DriverDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Driver Details"
      description={`Details for driver ID: ${id}`}
    />
  )
}
