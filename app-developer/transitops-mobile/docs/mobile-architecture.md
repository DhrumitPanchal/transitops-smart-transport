# Mobile architecture

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Expo SDK 57, React Native 0.86, React 19 |
| Routing | Expo Router (file-based) under `app/` |
| Data | TanStack Query v5 |
| Forms | react-hook-form + Zod (`@hookform/resolvers`) |
| HTTP | Axios (`src/api/apiClient.js`) |
| Realtime | socket.io-client (optional) |
| Storage | AsyncStorage + SecureStore (tokens) |
| Charts | react-native-chart-kit + SVG |

Path alias: `@` → `src/` (Babel `module-resolver`).

## App shell

```
app/
  _layout.jsx              Root providers (Query, Auth, Realtime, Toast)
  index.jsx                Boot / redirect
  (auth)/login|register    Public auth
  (app)/_layout.jsx        Drawer + gated stack
  (app)/dashboard.jsx
  (app)/vehicles|drivers|trips|maintenance|fuel|expenses|reports
  (app)/admin/users|roles
```

Dynamic routes use nested folders:

- `[id]/index.jsx` → `/resource/:id`
- `[id]/edit.jsx` → `/resource/:id/edit`
- `[id]/permissions.jsx` → `/admin/roles/:id/permissions`

Route constants live in `src/constants/routes.js`. Build concrete paths with `buildPath(ROUTES.X, { id })`.

## Layering

```
Screen (app/*)
  → hooks (useX / useCreateX)
    → services (mock | api)
      → mappers (API mode)
      → mock repositories (mock mode)
```

Screens own UI state (filters, modals, form panels). Hooks own cache keys and invalidation. Services never import React.

## Auth & permissions

`AuthContext` bootstraps session, exposes `user`, `permissions`, `hasPermission` / `canAccess`, and login/logout.

Screens gate with:

```js
const { allowed, isLoading } = useRequirePermission(PERMISSIONS.X_VIEW)
if (isLoading || !allowed) return <ScreenLoader />
```

Action buttons use `usePermissions().hasPermission(...)`. Drawer items in `NAVIGATION_ITEMS` also declare `permission` (and Super Admin–only `roles`).

Role → default permission sets: `src/constants/permissions.js` (`rolePermissions`). Super Admin–only permissions cannot be granted to other roles (`stripSuperAdminOnlyPermissions`).

## UI patterns

- **Lists:** `SearchBar` + `FilterSheet` + `FlatList` + `RefreshControl` (pull-to-refresh) + `PaginationControls` + `ListCard` / `StatusBadge`
- **Forms:** `Controller` + domain Zod schema + `FormSection` / `FormActions` + `applyApiFieldErrors`
- **Detail:** `Card` rows + permission-gated lifecycle actions (inline panels or `ConfirmModal`)
- **Feedback:** `ScreenLoader`, `EmptyState`, `ErrorState`, `InlineAlert`, `toast`

Theme tokens: `src/theme` (`colors.primary = #0f766e`).

## Response shapes

Mock repositories often return `{ data: { items, pagination } }` or `{ data: { item } }`. API mappers flatten lists to `{ data: [], pagination }`. Screens should use:

- `unwrapListResponse(response)`
- `unwrapEntityResponse(response, ['item', 'maintenance', ...])`

## Domain modules

| Module | Hooks | Lifecycle |
|--------|-------|-----------|
| Vehicles | CRUD + retire | Blocks retire when ON_TRIP |
| Drivers | CRUD + status/suspend | Licence fields |
| Trips | CRUD draft + dispatch/complete/cancel | Assigns vehicle/driver |
| Maintenance | CRUD + complete/cancel | Blocks ON_TRIP/RETIRED on create |
| Fuel | CRUD + delete | Cost-per-litre derived |
| Expenses | CRUD + delete | Optional vehicle/trip |
| Reports | summary + exportCsv | Date/vehicle filters |
| Users | CRUD + approve + changeStatus | Pending → Active + role |
| Roles | list/detail + updatePermissions | Strip Super Admin–only |

## Query keys

Centralized in `src/constants/queryKeys.js`. Mutations invalidate related `all` / `detail` keys plus dashboard/reports when operational costs change.

## Realtime

When enabled, `RealtimeContext` opens a socket after auth. `registerRealtimeHandlers` applies guarded patches via `realtimeCache` (deduped by `createGuardedHandler`). See `docs/realtime-events.md`.

## Testing seams

- Validations: pure Zod in `src/validations`
- Calculations: `src/utils/calculations.js`
- Permissions: `getPermissionsForRole`, strip helpers
- Mock DB: `src/mocks/mockDatabase.js` + repositories
