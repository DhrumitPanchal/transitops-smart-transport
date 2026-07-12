import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageContainer from '../../components/common/PageContainer'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import PermissionGate from '../../components/common/PermissionGate'
import UserFilters from '../../features/users/UserFilters'
import UserTable from '../../features/users/UserTable'
import ChangeUserStatusDialog from '../../features/users/ChangeUserStatusDialog'
import ApproveUserDialog from './ApproveUserDialog'
import {
  useUsers,
  useChangeUserStatus,
  useApproveUser,
} from '../../hooks/users'
import { useAuth } from '../../hooks/useAuth'
import { getUserErrorMessage } from '../../features/users/userErrors'
import { PERMISSIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { USER_STATUS } from '../../constants/statuses'
import { DEFAULT_PAGE_SIZE } from '../../constants/appConstants'
import { useDisclosure } from '../../hooks/useDisclosure'

const INITIAL_FILTERS = {
  search: '',
  role: '',
  status: '',
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function cleanParams(filters) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || DEFAULT_PAGE_SIZE,
    sortBy: filters.sortBy || 'name',
    sortDirection: filters.sortDirection || 'asc',
  }
  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.role) params.role = filters.role
  if (filters.status) params.status = filters.status
  return params
}

export default function UserListPage() {
  const { user: currentUser } = useAuth()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionError, setActionError] = useState(null)

  const statusDialog = useDisclosure()
  const approveDialog = useDisclosure()
  const statusMutation = useChangeUserStatus()
  const approveMutation = useApproveUser()

  const queryParams = useMemo(() => cleanParams(filters), [filters])
  const usersQuery = useUsers(queryParams)

  const rows = usersQuery.data?.data || []
  const pagination = usersQuery.data?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: 0,
  }

  const handleSortChange = (columnKey) => {
    setFilters((prev) => {
      if (prev.sortBy === columnKey) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
          page: 1,
        }
      }
      return {
        ...prev,
        sortBy: columnKey,
        sortDirection: 'asc',
        page: 1,
      }
    })
  }

  const openStatus = (record) => {
    setSelectedUser(record)
    setActionError(null)
    statusDialog.open()
  }

  const openApprove = (record) => {
    setSelectedUser(record)
    setActionError(null)
    approveDialog.open()
  }

  const closeStatus = () => {
    if (statusMutation.isPending) return
    statusDialog.close()
    setSelectedUser(null)
    setActionError(null)
  }

  const closeApprove = () => {
    if (approveMutation.isPending) return
    approveDialog.close()
    setSelectedUser(null)
    setActionError(null)
  }

  const handleStatusChange = async () => {
    if (!selectedUser || statusMutation.isPending) return
    const nextStatus =
      selectedUser.status === USER_STATUS.INACTIVE
        ? USER_STATUS.ACTIVE
        : USER_STATUS.INACTIVE

    if (
      selectedUser.status === USER_STATUS.PENDING &&
      nextStatus === USER_STATUS.ACTIVE
    ) {
      setActionError('Use Approve to assign a role and activate this account.')
      return
    }

    try {
      await statusMutation.mutateAsync({
        id: selectedUser.id,
        status: nextStatus,
      })
      toast.success(
        nextStatus === USER_STATUS.ACTIVE ? 'User activated' : 'User deactivated',
      )
      closeStatus()
    } catch (error) {
      setActionError(getUserErrorMessage(error))
    }
  }

  const handleApprove = async (values) => {
    if (!selectedUser || approveMutation.isPending) return
    await approveMutation.mutateAsync({
      id: selectedUser.id,
      payload: { role: values.role },
    })
    toast.success('User approved successfully.')
    closeApprove()
  }

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Review pending registrations, create accounts, and manage ACTIVE / INACTIVE access. Users are never permanently deleted."
        actions={
          <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
            <Link to={ROUTES.ADMIN_USERS_NEW}>
              <Button icon={Plus}>Add user</Button>
            </Link>
          </PermissionGate>
        }
      />

      <UserFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      <UserTable
        rows={rows}
        loading={usersQuery.isLoading}
        error={
          usersQuery.isError ? getUserErrorMessage(usersQuery.error) : null
        }
        sortBy={filters.sortBy}
        sortDirection={filters.sortDirection}
        onSortChange={handleSortChange}
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) =>
          setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
        }
        onChangeStatus={openStatus}
        onApprove={openApprove}
        emptyAction={
          <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
            <Link to={ROUTES.ADMIN_USERS_NEW}>
              <Button icon={Plus} variant="secondary">
                Add user
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <ChangeUserStatusDialog
        open={statusDialog.isOpen}
        user={selectedUser}
        currentUserId={currentUser?.id}
        loading={statusMutation.isPending}
        errorMessage={actionError}
        onClose={closeStatus}
        onConfirm={handleStatusChange}
      />

      <ApproveUserDialog
        open={approveDialog.isOpen}
        user={selectedUser}
        currentUserId={currentUser?.id}
        loading={approveMutation.isPending}
        errorMessage={actionError}
        onClose={closeApprove}
        onConfirm={handleApprove}
      />
    </PageContainer>
  )
}
