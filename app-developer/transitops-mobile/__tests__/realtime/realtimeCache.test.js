import { QueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { DRIVER_STATUS, VEHICLE_STATUS } from '@/constants/statuses'
import { SOCKET_EVENTS } from '@/constants/socketEvents'
import {
  applyVehicleCacheUpdate,
  removeItemById,
  syncDriverAvailableCache,
  syncVehicleAvailableCache,
  updateItemById,
  upsertItemById,
  updatePaginatedQueryData,
} from '@/realtime/realtimeCache'
import { resetRealtimeEventGuard } from '@/realtime/realtimeEventGuard'
import { registerRealtimeHandlers } from '@/realtime/registerRealtimeHandlers'

jest.mock('@/services/vehicleService', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  retire: jest.fn(),
  getAvailable: jest.fn(),
}))
jest.mock('@/services/driverService', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  changeStatus: jest.fn(),
  suspend: jest.fn(),
  getAvailable: jest.fn(),
}))
jest.mock('@/services/tripService', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  updateDraft: jest.fn(),
  dispatch: jest.fn(),
  complete: jest.fn(),
  cancel: jest.fn(),
}))
jest.mock('@/services/fuelService', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('@/services/expenseService', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('@/services/maintenanceService', () => ({
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  complete: jest.fn(),
  cancel: jest.fn(),
}))

import * as vehicleService from '@/services/vehicleService'
import * as driverService from '@/services/driverService'
import * as tripService from '@/services/tripService'
import * as fuelService from '@/services/fuelService'
import * as expenseService from '@/services/expenseService'
import * as maintenanceService from '@/services/maintenanceService'

function createFakeSocket() {
  const handlers = new Map()
  return {
    on: jest.fn((event, handler) => {
      handlers.set(event, handler)
    }),
    off: jest.fn((event) => {
      handlers.delete(event)
    }),
    onAny: jest.fn(),
    offAny: jest.fn(),
    emit: (event, payload) => {
      const handler = handlers.get(event)
      if (handler) handler(payload)
    },
  }
}

describe('realtimeCache helpers', () => {
  beforeEach(() => {
    resetRealtimeEventGuard()
  })

  it('upserts, updates, and removes items by id', () => {
    const items = [{ id: '1', name: 'A' }]
    const upserted = upsertItemById(items, { id: '2', name: 'B' })
    expect(upserted).toHaveLength(2)

    const merged = upsertItemById(upserted, { id: '1', name: 'A2' })
    expect(merged.find((item) => item.id === '1').name).toBe('A2')

    const updated = updateItemById(merged, { id: '2', name: 'B2' })
    expect(updated.find((item) => item.id === '2').name).toBe('B2')

    const removed = removeItemById(updated, '1')
    expect(removed.map((item) => item.id)).toEqual(['2'])
  })

  it('updates flat paginated query data', () => {
    const oldData = {
      data: [{ id: '1', name: 'A' }],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    }
    const next = updatePaginatedQueryData(oldData, (items) =>
      upsertItemById(items, { id: '2', name: 'B' }),
    )
    expect(next.data).toHaveLength(2)
  })

  it('syncs available vehicle cache by status', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(QUERY_KEYS.vehicles.available, {
      data: [{ id: 'veh_1', status: VEHICLE_STATUS.AVAILABLE }],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    })

    syncVehicleAvailableCache(queryClient, {
      id: 'veh_1',
      status: VEHICLE_STATUS.ON_TRIP,
    })
    expect(queryClient.getQueryData(QUERY_KEYS.vehicles.available).data).toEqual(
      [],
    )

    syncVehicleAvailableCache(queryClient, {
      id: 'veh_2',
      status: VEHICLE_STATUS.AVAILABLE,
      registrationNumber: 'KA99',
    })
    expect(
      queryClient.getQueryData(QUERY_KEYS.vehicles.available).data.some(
        (item) => item.id === 'veh_2',
      ),
    ).toBe(true)
  })

  it('syncs available driver cache with licence awareness', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(QUERY_KEYS.drivers.available, {
      data: [],
      pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
    })

    syncDriverAvailableCache(queryClient, {
      id: 'drv_x',
      status: DRIVER_STATUS.AVAILABLE,
      licenseExpiryDate: '2020-01-01',
    })
    expect(queryClient.getQueryData(QUERY_KEYS.drivers.available).data).toEqual(
      [],
    )

    syncDriverAvailableCache(queryClient, {
      id: 'drv_y',
      status: DRIVER_STATUS.AVAILABLE,
      licenseExpiryDate: '2029-01-01',
      name: 'Valid',
    })
    expect(
      queryClient.getQueryData(QUERY_KEYS.drivers.available).data.some(
        (item) => item.id === 'drv_y',
      ),
    ).toBe(true)
  })

  it('applyVehicleCacheUpdate patches detail cache', () => {
    const queryClient = new QueryClient()
    applyVehicleCacheUpdate(
      queryClient,
      { id: 'veh_9', status: VEHICLE_STATUS.AVAILABLE, vehicleName: 'New' },
      { isCreate: true },
    )
    expect(
      queryClient.getQueryData(QUERY_KEYS.vehicles.detail('veh_9')).data
        .vehicleName,
    ).toBe('New')
  })
})

describe('registerRealtimeHandlers', () => {
  beforeEach(() => {
    resetRealtimeEventGuard()
    jest.clearAllMocks()
  })

  it('registers handlers that update cache without calling services', () => {
    const socket = createFakeSocket()
    const queryClient = new QueryClient()
    const cleanup = registerRealtimeHandlers(socket, queryClient)

    expect(socket.on).toHaveBeenCalledWith(
      SOCKET_EVENTS.VEHICLE_CREATED,
      expect.any(Function),
    )

    socket.emit(SOCKET_EVENTS.VEHICLE_CREATED, {
      eventId: 'veh-created-1',
      data: {
        vehicle: {
          id: 'veh_rt',
          status: VEHICLE_STATUS.AVAILABLE,
          vehicleName: 'Realtime Bus',
        },
      },
    })

    expect(
      queryClient.getQueryData(QUERY_KEYS.vehicles.detail('veh_rt'))?.data
        ?.vehicleName,
    ).toBe('Realtime Bus')

    const serviceMocks = [
      vehicleService,
      driverService,
      tripService,
      fuelService,
      expenseService,
      maintenanceService,
    ]
    serviceMocks.forEach((service) => {
      Object.values(service).forEach((fn) => {
        if (typeof fn === 'function' && fn.mock) {
          expect(fn).not.toHaveBeenCalled()
        }
      })
    })

    cleanup()
    expect(socket.off).toHaveBeenCalled()
  })

  it('ignores duplicate realtime event ids', () => {
    const socket = createFakeSocket()
    const queryClient = new QueryClient()
    registerRealtimeHandlers(socket, queryClient)

    const payload = {
      eventId: 'dup-1',
      data: {
        vehicle: {
          id: 'veh_dup',
          status: VEHICLE_STATUS.AVAILABLE,
          vehicleName: 'First',
        },
      },
    }

    socket.emit(SOCKET_EVENTS.VEHICLE_UPDATED, payload)
    socket.emit(SOCKET_EVENTS.VEHICLE_UPDATED, {
      ...payload,
      data: {
        vehicle: {
          id: 'veh_dup',
          status: VEHICLE_STATUS.AVAILABLE,
          vehicleName: 'Second',
        },
      },
    })

    expect(
      queryClient.getQueryData(QUERY_KEYS.vehicles.detail('veh_dup')).data
        .vehicleName,
    ).toBe('First')
  })
})
