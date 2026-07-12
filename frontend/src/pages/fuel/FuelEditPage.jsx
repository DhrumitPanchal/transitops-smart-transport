import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function FuelEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Fuel Log"
      description={`Edit form for fuel log ID: ${id}`}
    />
  )
}
