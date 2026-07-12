import { QUERY_KEYS } from '../../constants/queryKeys'
import {
  markQueriesStaleWithoutRefetch,
  updatePaginatedQueryData,
  updateSingleQueryData,
  upsertItemById,
} from '../../realtime/realtimeCache'

function sanitizeRole(record) {
  if (!record) return record
  return {
    ...record,
    permissions: Array.isArray(record.permissions)
      ? [...record.permissions]
      : [],
  }
}

export function setRoleDetailCache(queryClient, record) {
  const role = sanitizeRole(record)
  if (!role?.id) return

  queryClient.setQueryData(QUERY_KEYS.roles.detail(role.id), (oldData) => {
    if (!oldData) return { data: { ...role } }
    return updateSingleQueryData(oldData, role)
  })
}

function applyRoleToLists(queryClient, role) {
  const listQueries = queryClient.getQueriesData({
    queryKey: QUERY_KEYS.roles.lists,
  })

  if (!listQueries.length) {
    // Also support queries keyed as QUERY_KEYS.roles.all / list without params
    queryClient.setQueriesData({ queryKey: QUERY_KEYS.roles.all }, (oldData) => {
      if (!oldData) return oldData
      if (Array.isArray(oldData.data)) {
        return updatePaginatedQueryData(oldData, (items) =>
          upsertItemById(items, role),
        )
      }
      return oldData
    })
    return
  }

  listQueries.forEach(([queryKey, oldData]) => {
    if (!oldData) {
      markQueriesStaleWithoutRefetch(queryClient, queryKey)
      return
    }

    queryClient.setQueryData(queryKey, (current) => {
      if (!current) return current
      if (Array.isArray(current.data)) {
        return updatePaginatedQueryData(current, (items) =>
          upsertItemById(items, role),
        )
      }
      return current
    })
  })
}

export function applyRolePermissionsCacheUpdate(queryClient, role) {
  const nextRole = sanitizeRole(role)
  if (!queryClient || !nextRole?.id) return

  setRoleDetailCache(queryClient, nextRole)
  applyRoleToLists(queryClient, nextRole)
}

export function unwrapRoleResponse(response) {
  const data = response?.data ?? response
  if (!data) return null
  return sanitizeRole(data.role || data)
}
