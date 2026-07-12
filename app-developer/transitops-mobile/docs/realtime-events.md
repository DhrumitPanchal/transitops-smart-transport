# Realtime events

Socket.IO is optional. Enable with:

```
EXPO_PUBLIC_ENABLE_REALTIME=true
EXPO_PUBLIC_SOCKET_URL=http://<host>:5000
EXPO_PUBLIC_USE_MOCKS=false
```

Connection lifecycle lives in `src/realtime/socketClient.js` and `RealtimeContext`. Status badge uses `REALTIME_STATUS` from `src/constants/socketEvents.js`.

## Event names

Defined in `src/constants/socketEvents.js` (`SOCKET_EVENTS`):

### Vehicles
- `vehicle.created`
- `vehicle.updated`
- `vehicle.retired`
- `vehicle.status_changed`

### Drivers
- `driver.created`
- `driver.updated`
- `driver.status_changed`

### Trips
- `trip.created`
- `trip.updated`
- `trip.dispatched`
- `trip.completed`
- `trip.cancelled`

### Maintenance
- `maintenance.created`
- `maintenance.updated`
- `maintenance.completed`
- `maintenance.cancelled`

### Fuel
- `fuel.created`
- `fuel.updated`
- `fuel.deleted`

### Expenses
- `expense.created`
- `expense.updated`
- `expense.deleted`

### Users / auth
- `user.created`
- `user.updated`
- `user.status_changed`
- `user.account_updated`
- `user.account_deactivated`
- `auth.session_changed`

### Roles
- `role.permissions_updated`

## Handler behavior

`registerRealtimeHandlers.js` wraps each listener with `createGuardedHandler` (dedupe / ordering guard via `realtimeEventGuard`).

Typical effects (`realtimeCache.js`):

| Event family | Cache effect |
|--------------|--------------|
| Entity created/updated | Patch list + detail query data |
| Entity deleted | Remove from lists; drop detail |
| Trip / maintenance lifecycle | Update trip/maintenance + linked vehicle/driver |
| User status / account | Patch users; may force logout if current user deactivated |
| Role permissions | Invalidate roles; refresh session permissions when applicable |
| Ops cost changes | Optionally mark dashboard/reports stale |

Payloads are normalized with `fromApiEnvelope` (camelCase). Entity extraction prefers nested keys (`data.vehicle`, `data.item`, etc.).

## Connection events

Also handled: `connect`, `disconnect`, `connect_error` (`SOCKET_CONNECTION_EVENTS`).

## Client expectations

1. Authenticate first — socket auth uses the same bearer token.
2. Do not rely on sockets for correctness; REST remains source of truth. Realtime is a cache accelerator.
3. When realtime is disabled, screens still refresh via pull-to-refresh and mutation invalidation.
4. Reports use `staleTime: 60_000`; live events may mark data stale without auto-refetch — pull to refresh or change filters.

## Testing realtime

1. Two clients (or web + mobile) on the same backend.
2. Mutate an entity on client A.
3. Confirm client B list/detail updates without manual refresh.
4. Deactivate the current user from another session → expect forced logout on `user.account_deactivated` / session events.
