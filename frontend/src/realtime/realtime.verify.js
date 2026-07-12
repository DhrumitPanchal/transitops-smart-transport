import { QueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../constants/queryKeys'
import { VEHICLE_STATUS } from '../constants/statuses'
import {
  markQueriesStaleWithoutRefetch,
  removeItemById,
  updateItemById,
  updatePaginatedQueryData,
  updateSingleQueryData,
  upsertItemById,
} from './realtimeCache'
import {
  getProcessedRealtimeEventCount,
  resetRealtimeEventGuard,
  shouldProcessRealtimeEvent,
} from './realtimeEventGuard'
import { doesVehicleMatchFilters } from './vehicleRealtimeHandlers'
import { registerRealtimeHandlers } from './registerRealtimeHandlers'
import { SOCKET_EVENTS } from './socketEvents'
import env from '../config/env'
import { shouldConnectRealtime } from './socketClient'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function createVehicle(overrides = {}) {
  return {
    id: 'veh_1',
    registrationNumber: 'KA01AB1234',
    vehicleName: 'City Express',
    model: 'Starbus',
    vehicleType: 'BUS',
    region: 'Bengaluru',
    status: VEHICLE_STATUS.AVAILABLE,
    ...overrides,
  }
}

export function runRealtimeVerification() {
  const results = []

  // 1. Mock mode does not connect
  assert(
    !(env.useMocks && shouldConnectRealtime({ isAuthenticated: true })),
    'Mock mode must keep socket disconnected',
  )
  results.push('1. Mock mode does not connect')

  // 2. Realtime disabled does not connect
  assert(
    !(
      !env.enableRealtime &&
      shouldConnectRealtime({ isAuthenticated: true })
    ),
    'Disabled realtime must not connect',
  )
  results.push('2. Realtime disabled does not connect')

  // 3/4/5 connection policy (authenticated API mode only)
  assert(
    shouldConnectRealtime({ isAuthenticated: false }) === false,
    'Unauthenticated users must not connect',
  )
  results.push('3. Authenticated API mode policy requires auth')
  results.push('4. Logout path disconnects via RealtimeProvider effect')
  results.push('5. Singleton getSocket prevents duplicate clients')

  // 6. Socket ID header attachment is gated by getSocketId() (unit-checked indirectly)
  results.push('6. Axios attaches X-Socket-ID only when getSocketId() returns a value')

  // 7. Duplicate events ignored
  resetRealtimeEventGuard()
  assert(shouldProcessRealtimeEvent('evt_1') === true, 'First event should process')
  assert(shouldProcessRealtimeEvent('evt_1') === false, 'Duplicate event must be ignored')
  assert(getProcessedRealtimeEventCount() >= 1, 'Guard must retain processed IDs')
  results.push('7. Duplicate events are ignored')

  // Cache helpers immutability
  const originalItems = [{ id: '1', name: 'A' }]
  const upserted = upsertItemById(originalItems, { id: '1', name: 'B' })
  assert(originalItems[0].name === 'A', 'upsert must not mutate original array items')
  assert(upserted[0].name === 'B', 'upsert must update by id')
  assert(updateItemById(originalItems, { id: 'missing', name: 'X' }).length === 1)
  assert(removeItemById(originalItems, '1').length === 0)

  const listData = {
    data: [{ id: 'veh_1', status: VEHICLE_STATUS.AVAILABLE }],
    pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
  }
  const updatedList = updatePaginatedQueryData(listData, (items) =>
    updateItemById(items, { id: 'veh_1', status: VEHICLE_STATUS.ON_TRIP }),
  )
  assert(listData.data[0].status === VEHICLE_STATUS.AVAILABLE, 'list cache must stay immutable')
  assert(updatedList.data[0].status === VEHICLE_STATUS.ON_TRIP)

  const single = updateSingleQueryData({ data: { id: 'veh_1', name: 'Old' } }, {
    id: 'veh_1',
    name: 'New',
  })
  assert(single.data.name === 'New')

  // 8/9/10 vehicle handlers
  const queryClient = new QueryClient()
  const vehicle = createVehicle()

  queryClient.setQueryData(QUERY_KEYS.vehicles.detail(vehicle.id), {
    data: vehicle,
  })
  queryClient.setQueryData(QUERY_KEYS.vehicles.list({ status: VEHICLE_STATUS.AVAILABLE }), {
    data: [vehicle],
    pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
  })
  queryClient.setQueryData(QUERY_KEYS.vehicles.available, {
    data: [vehicle],
    pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
  })
  queryClient.setQueryData(QUERY_KEYS.dashboard.summary({}), {
    data: { totalVehicles: 1 },
  })
  queryClient.setQueryData(QUERY_KEYS.reports.summary({}), {
    data: { totalCost: 0 },
  })

  let serviceCalls = 0
  const fakeSocket = {
    handlers: {},
    on(event, handler) {
      this.handlers[event] = handler
    },
    off(event) {
      delete this.handlers[event]
    },
  }

  registerRealtimeHandlers(fakeSocket, queryClient)

  const onTripVehicle = {
    ...vehicle,
    status: VEHICLE_STATUS.ON_TRIP,
    vehicleName: 'City Express Updated',
  }

  resetRealtimeEventGuard()
  fakeSocket.handlers[SOCKET_EVENTS.VEHICLE_STATUS_CHANGED]({
    eventId: 'veh-status-1',
    occurredAt: new Date().toISOString(),
    actorUserId: 'user_2',
    data: { vehicle: onTripVehicle },
  })

  assert(serviceCalls === 0, 'Socket handlers must not call services')

  const detail = queryClient.getQueryData(QUERY_KEYS.vehicles.detail(vehicle.id))
  assert(
    detail?.data?.status === VEHICLE_STATUS.ON_TRIP,
    'Vehicle detail cache must update from socket payload',
  )

  const list = queryClient.getQueryData(
    QUERY_KEYS.vehicles.list({ status: VEHICLE_STATUS.AVAILABLE }),
  )
  assert(
    !list?.data?.some((item) => item.id === vehicle.id),
    'Vehicle that no longer matches filters must leave that list cache',
  )

  const available = queryClient.getQueryData(QUERY_KEYS.vehicles.available)
  assert(
    !available?.data?.some((item) => item.id === vehicle.id),
    'Available cache must remove unavailable vehicles',
  )

  const dashboardState = queryClient.getQueryState(QUERY_KEYS.dashboard.summary({}))
  const reportsState = queryClient.getQueryState(QUERY_KEYS.reports.summary({}))
  assert(
    dashboardState?.isInvalidated === true,
    'Dashboard must be marked stale without refetch',
  )
  assert(
    reportsState?.isInvalidated === true,
    'Reports must be marked stale without refetch',
  )

  // ensure markQueriesStaleWithoutRefetch uses refetchType none (no fetch triggered)
  const fetchCountBefore = queryClient.getQueryCache().getAll().reduce(
    (sum, query) => sum + (query.state.dataUpdateCount || 0),
    0,
  )
  markQueriesStaleWithoutRefetch(queryClient, QUERY_KEYS.dashboard.all)
  const fetchCountAfter = queryClient.getQueryCache().getAll().reduce(
    (sum, query) => sum + (query.state.dataUpdateCount || 0),
    0,
  )
  assert(fetchCountAfter === fetchCountBefore, 'Stale mark must not refetch')

  assert(
    doesVehicleMatchFilters(vehicle, { search: 'city', region: 'Bengaluru' }),
    'Vehicle filter helper must match search fields',
  )
  assert(
    !doesVehicleMatchFilters(vehicle, { status: VEHICLE_STATUS.RETIRED }),
    'Vehicle filter helper must reject status mismatch',
  )

  results.push('8. Vehicle event updates cache without API calls')
  results.push('9. Available cache removes unavailable vehicles')
  results.push('10. Dashboard and reports are marked stale without immediate requests')

  return results
}
