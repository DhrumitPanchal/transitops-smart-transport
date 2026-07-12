import {
  applyExpenseCacheDelete,
  applyExpenseCacheUpdate,
  unwrapExpenseResponse,
} from '../features/expenses/expenseQueryCache'
import { createGuardedHandler } from './createGuardedHandler'
import { SOCKET_EVENTS } from './socketEvents'

export { doesExpenseMatchFilters } from '../features/expenses/doesExpenseMatchFilters'

function extractRecord(payload) {
  const data = payload?.data
  if (!data) return null
  if (data.expense) return data.expense
  if (data.id) return data
  return null
}

function extractDeletedId(payload) {
  const data = payload?.data
  if (!data) return null
  if (typeof data === 'string' || typeof data === 'number') return data
  return data.id || data.expense?.id || null
}

export function registerExpenseRealtimeHandlers(socket, queryClient) {
  if (!socket || !queryClient) return () => {}

  const onCreated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractRecord(payload) || unwrapExpenseResponse(payload)
    if (!record?.id) return
    applyExpenseCacheUpdate(client, record, { isCreate: true })
  })

  const onUpdated = createGuardedHandler(queryClient, (client, payload) => {
    const record = extractRecord(payload) || unwrapExpenseResponse(payload)
    if (!record?.id) return
    applyExpenseCacheUpdate(client, record, { isCreate: false })
  })

  const onDeleted = createGuardedHandler(queryClient, (client, payload) => {
    const id = extractDeletedId(payload)
    if (!id) return
    applyExpenseCacheDelete(client, id)
  })

  socket.on(SOCKET_EVENTS.EXPENSE_CREATED, onCreated)
  socket.on(SOCKET_EVENTS.EXPENSE_UPDATED, onUpdated)
  socket.on(SOCKET_EVENTS.EXPENSE_DELETED, onDeleted)

  return () => {
    socket.off(SOCKET_EVENTS.EXPENSE_CREATED, onCreated)
    socket.off(SOCKET_EVENTS.EXPENSE_UPDATED, onUpdated)
    socket.off(SOCKET_EVENTS.EXPENSE_DELETED, onDeleted)
  }
}
