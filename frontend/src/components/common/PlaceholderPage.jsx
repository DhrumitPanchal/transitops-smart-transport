import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageContainer from '../common/PageContainer'
import PageHeader from '../common/PageHeader'
import EmptyState from '../feedback/EmptyState'
import Button from '../common/Button'
import PermissionGate from '../common/PermissionGate'

export default function PlaceholderPage({
  title,
  description,
  createPermission,
  createTo,
  createLabel = 'Create',
}) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        actions={
          createPermission && createTo ? (
            <PermissionGate permission={createPermission}>
              <Link to={createTo}>
                <Button icon={Plus}>{createLabel}</Button>
              </Link>
            </PermissionGate>
          ) : null
        }
      />
      <EmptyState
        title="Content coming soon"
        description="This page is a placeholder and will be implemented next."
      />
    </PageContainer>
  )
}
