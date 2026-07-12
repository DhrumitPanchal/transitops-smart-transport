import { useParams } from 'react-router-dom'
import PlaceholderPage from '../../components/common/PlaceholderPage'

export default function DriverEditPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Edit Driver"
      description={`Edit form for driver ID: ${id}`}
    />
  )
}
