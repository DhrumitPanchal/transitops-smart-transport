import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function FuelDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Fuel Log Details"
      description={`Details for fuel log ID: ${id}`}
    />
  )
}
