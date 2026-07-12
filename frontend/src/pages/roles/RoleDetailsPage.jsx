import { Link, useNavigate, useParams } from 'react-router-dom'
import { Shield } from 'lucide-react'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import PermissionGate from '../../components/common/PermissionGate'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import { useRole } from '../../hooks/roles'
import { getRoleErrorMessage } from '../../features/roles/roleErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { ROLES } from '../../constants/roles'
import { buildPath } from '../../utils/helpers'
import { formatDateTime } from '../../utils/formatters'
import { groupPermissions } from '../../utils/permissionGroups'

export default function RoleDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roleQuery = useRole(id)
  const role = roleQuery.data?.data

  if (roleQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Role details" description="Loading..." />
        <TableSkeleton columns={2} rows={6} />
      </PageContainer>
    )
  }

  if (roleQuery.isError || !role) {
    return (
      <PageContainer>
        <PageHeader title="Role details" />
        <ErrorState
          title="Unable to load role"
          description={getRoleErrorMessage(roleQuery.error)}
          onRetry={() => roleQuery.refetch()}
        />
      </PageContainer>
    )
  }

  const groups = groupPermissions(role.permissions || [])
  const isSuperAdmin = role.key === ROLES.SUPER_ADMIN

  return (
    <PageContainer>
      <PageHeader
        title={role.name}
        description={role.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.ROLES_EDIT_PERMISSIONS}>
              <Link
                to={buildPath(ROUTES.ADMIN_ROLE_PERMISSIONS, { id: role.id })}
              >
                <Button icon={Shield}>
                  {isSuperAdmin ? 'View permissions' : 'Edit permissions'}
                </Button>
              </Link>
            </PermissionGate>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.ADMIN_ROLES)}
            >
              Back to roles
            </Button>
          </div>
        }
      />

      <Card>
        <SectionTitle
          title="Permissions"
          description={
            isSuperAdmin
              ? 'Super Admin permissions cannot be removed.'
              : `Updated ${formatDateTime(role.updatedAt) || '—'}`
          }
        />
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-sm font-semibold text-slate-800">
                {group.label}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    {item.key}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  )
}
