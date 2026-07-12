import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import { useRoles } from '../../hooks/roles'
import { getRoleErrorMessage } from '../../features/roles/roleErrors'
import { ROUTES } from '../../constants/routes'
import { buildPath } from '../../utils/helpers'

export default function RoleListPage() {
  const rolesQuery = useRoles({ pageSize: 50, sortBy: 'name' })
  const roles = rolesQuery.data?.data || []

  if (rolesQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Roles" description="Loading roles..." />
        <TableSkeleton columns={3} rows={5} />
      </PageContainer>
    )
  }

  if (rolesQuery.isError) {
    return (
      <PageContainer>
        <PageHeader title="Roles" />
        <ErrorState
          title="Unable to load roles"
          description={getRoleErrorMessage(rolesQuery.error)}
          onRetry={() => rolesQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Roles"
        description="Super Admin, Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <Link
                  to={buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: role.id })}
                  className="text-lg font-semibold text-slate-900 hover:text-teal-700"
                >
                  {role.name}
                </Link>
                <p className="mt-1 text-sm text-slate-500">{role.description}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {(role.permissions || []).length} permissions
            </p>
            <div className="mt-auto flex gap-3 pt-2">
              <Link
                to={buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: role.id })}
                className="text-sm font-medium text-teal-700 hover:underline"
              >
                View
              </Link>
              <Link
                to={buildPath(ROUTES.ADMIN_ROLE_PERMISSIONS, { id: role.id })}
                className="text-sm font-medium text-slate-700 hover:underline"
              >
                Edit permissions
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
