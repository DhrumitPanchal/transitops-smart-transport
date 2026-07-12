import { useMemo, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import InlineAlert from '../../components/feedback/InlineAlert'
import ErrorState from '../../components/feedback/ErrorState'
import TableSkeleton from '../../components/tables/TableSkeleton'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useRole, useUpdateRolePermissions } from '../../hooks/roles'
import { getRoleErrorMessage } from '../../features/roles/roleErrors'
import { ALL_PERMISSIONS, SUPER_ADMIN_ONLY_PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { ROLES } from '../../constants/roles'
import { buildPath } from '../../utils/helpers'
import { groupPermissions } from '../../utils/permissionGroups'

function samePermissionSet(left = [], right = []) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((item) => rightSet.has(item))
}

function RolePermissionsEditor({ role }) {
  const navigate = useNavigate()
  const updateMutation = useUpdateRolePermissions()
  const isSuperAdmin = role.key === ROLES.SUPER_ADMIN

  const editablePermissions = useMemo(
    () =>
      isSuperAdmin
        ? ALL_PERMISSIONS
        : ALL_PERMISSIONS.filter(
            (permission) => !SUPER_ADMIN_ONLY_PERMISSIONS.includes(permission),
          ),
    [isSuperAdmin],
  )

  const initialPermissions = useMemo(() => {
    const source = [...(role.permissions || [])]
    if (isSuperAdmin) return source
    return source.filter(
      (permission) => !SUPER_ADMIN_ONLY_PERMISSIONS.includes(permission),
    )
  }, [role.permissions, isSuperAdmin])

  const [selected, setSelected] = useState(initialPermissions)
  const [baseline, setBaseline] = useState(initialPermissions)
  const [formError, setFormError] = useState(null)

  const isDirty = useMemo(
    () => !samePermissionSet(selected, baseline),
    [selected, baseline],
  )

  const blocker = useBlocker(isDirty)
  const groups = useMemo(
    () => groupPermissions(editablePermissions),
    [editablePermissions],
  )

  const togglePermission = (permission) => {
    if (isSuperAdmin) return
    setSelected((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    )
  }

  const selectModule = (modulePermissions) => {
    if (isSuperAdmin) return
    setSelected((prev) => [
      ...new Set([...prev, ...modulePermissions.map((item) => item.key)]),
    ])
  }

  const clearModule = (modulePermissions) => {
    if (isSuperAdmin) return
    const remove = new Set(modulePermissions.map((item) => item.key))
    setSelected((prev) => prev.filter((item) => !remove.has(item)))
  }

  const handleReset = () => {
    setSelected([...baseline])
    setFormError(null)
  }

  const handleSave = async () => {
    if (updateMutation.isPending || isSuperAdmin) return
    setFormError(null)

    const permissions = selected.filter(
      (permission) => !SUPER_ADMIN_ONLY_PERMISSIONS.includes(permission),
    )

    try {
      await updateMutation.mutateAsync({
        id: role.id,
        permissions,
      })
      setBaseline([...permissions])
      setSelected([...permissions])
      toast.success('Permissions saved')
    } catch (error) {
      setFormError(getRoleErrorMessage(error))
    }
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={`${role.name} permissions`}
        description={
          isSuperAdmin
            ? 'Super Admin permissions cannot be removed.'
            : 'Group permissions by module. Unsaved changes will warn before leaving.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={!isDirty || updateMutation.isPending || isSuperAdmin}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              loading={updateMutation.isPending}
              disabled={!isDirty || updateMutation.isPending || isSuperAdmin}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(buildPath(ROUTES.ADMIN_ROLE_DETAIL, { id: role.id }))
              }
            >
              Back
            </Button>
          </div>
        }
      />

      {isDirty ? (
        <div className="mb-4">
          <InlineAlert tone="warning" title="Unsaved changes">
            You have unsaved permission changes.
          </InlineAlert>
        </div>
      ) : null}

      {isSuperAdmin ? (
        <div className="mb-4">
          <InlineAlert tone="info" title="Locked role">
            Super Admin always retains every permission. Editing is disabled.
          </InlineAlert>
        </div>
      ) : null}

      {formError ? (
        <div className="mb-4">
          <InlineAlert tone="error" title="Unable to save">
            {formError}
          </InlineAlert>
        </div>
      ) : null}

      <div className="space-y-4">
        {groups.map((group) => {
          const keys = group.items.map((item) => item.key)
          const selectedCount = keys.filter((key) =>
            selected.includes(key),
          ).length

          return (
            <Card key={group.key}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionTitle
                  title={group.label}
                  description={`${selectedCount} of ${keys.length} selected`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isSuperAdmin || updateMutation.isPending}
                    onClick={() => selectModule(group.items)}
                  >
                    Select all
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSuperAdmin || updateMutation.isPending}
                    onClick={() => clearModule(group.items)}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const checked = selected.includes(item.key)
                  return (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={checked}
                          disabled={isSuperAdmin || updateMutation.isPending}
                          onChange={() => togglePermission(item.key)}
                        />
                        <span>
                          <span className="block font-medium text-slate-800">
                            {item.label}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {item.key}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Discard unsaved changes?"
        message="You have unsaved permission changes. Leave this page without saving?"
        confirmLabel="Leave without saving"
        cancelLabel="Stay"
        variant="danger"
      />
    </PageContainer>
  )
}

export default function RolePermissionsPage() {
  const { id } = useParams()
  const roleQuery = useRole(id)
  const role = roleQuery.data?.data

  if (roleQuery.isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Role permissions" description="Loading..." />
        <TableSkeleton columns={2} rows={8} />
      </PageContainer>
    )
  }

  if (roleQuery.isError || !role) {
    return (
      <PageContainer>
        <PageHeader title="Role permissions" />
        <ErrorState
          title="Unable to load role"
          description={getRoleErrorMessage(roleQuery.error)}
          onRetry={() => roleQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <RolePermissionsEditor
      key={`${role.id}-${role.updatedAt || role.permissions?.length || 0}`}
      role={role}
    />
  )
}
