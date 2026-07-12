# Backend integration

## Modes

| Mode | Flag | Behavior |
|------|------|----------|
| Mock | `EXPO_PUBLIC_USE_MOCKS=true` | `src/mocks/repositories/*` + in-memory/persisted mock DB |
| API | `EXPO_PUBLIC_USE_MOCKS=false` | Axios → `EXPO_PUBLIC_API_BASE_URL` + mappers |

`src/services/serviceMode.js` exports `isMockMode()` / `getServiceMode()`.

Every domain service follows:

```js
if (isMockMode()) return mockRepository.action(...)
const { data } = await apiClient.method(ENDPOINTS..., { params / body })
return fromApi*(data)
```

## Base URL & auth

- Client: `src/api/apiClient.js`
- Endpoints: `src/api/endpoints.js`
- Errors: `src/api/apiError.js` → `status`, `code`, `fieldErrors`, message
- Auth header: Bearer token from SecureStore (`EXPO_PUBLIC_AUTH_MODE=bearer`)

On 401, session clears and the user is sent to login.

## Envelope conventions

Backend responses are camelCase. Mappers use `src/mappers/apiEnvelope.js`:

| Helper | Purpose |
|--------|---------|
| `mapListResponse` | Flatten `data.items` → `data[]`, normalize pagination (`pageSize`/`limit`, `totalItems`/`totalRecords`) |
| `mapSingleResponse` | Map `data` entity |
| `mapLifecycleResponse` | Nested entities (e.g. maintenance + vehicle) |
| `toApiParams` | `pageSize` → `limit`, `sortDirection` → `sortOrder`, strip empties |

Screens should still call `unwrapListResponse` / `unwrapEntityResponse` so mock and API both work.

## REST surface (mobile)

| Domain | Paths (under `/api/v1`) |
|--------|-------------------------|
| Auth | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout` |
| Vehicles | `/vehicles`, `/vehicles/:id`, `/vehicles/:id/retire`, `/vehicles/available` |
| Drivers | `/drivers`, status/suspend endpoints |
| Trips | `/trips`, dispatch/complete/cancel |
| Maintenance | `/maintenance`, `/:id/complete`, `/:id/cancel` |
| Fuel | `/fuel-logs` |
| Expenses | `/expenses` |
| Reports | `/reports/summary`, `/reports/export/csv` |
| Users | `/users`, `/:id/status`, `/:id/approve` |
| Roles | `/roles`, `/:id/permissions`, `/roles/permissions` (catalog) |

Exact path helpers: `src/api/endpoints.js`.

## Switching mock → API checklist

1. Backend running and reachable from the device/emulator.
2. `.env`: `EXPO_PUBLIC_USE_MOCKS=false`, correct `API_BASE_URL` / `SOCKET_URL`.
3. Restart Metro so env reloads.
4. Clear SecureStore session (logout) before testing API auth.
5. Confirm CORS / network security (Android cleartext if http).
6. Smoke: login → list one module → create → detail → lifecycle action.

## Field validation

Client Zod schemas mirror website rules (`src/validations/*`). Server field errors map via `applyApiFieldErrors(setError, error)`.

Notable business rules enforced client + mock/API:

- Maintenance: vehicle must not be `ON_TRIP` or `RETIRED`
- Vehicle form status: cannot manually set `ON_TRIP` / `IN_SHOP`
- User approve: `PENDING` → `ACTIVE` + selected `role`; password untouched
- Role permissions: strip `SUPER_ADMIN_ONLY` for non–Super Admin roles

## CSV export

1. `reportService.exportCsv(params)` → `{ fileName, content, contentType }`
2. `shareCsvString(content, fileName)` from `src/utils/csvExport.js` writes cache file and opens the system share sheet

Permission: `reports.export`.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Network error on device | Using `localhost`; use LAN IP or `10.0.2.2` |
| Empty lists in mock | Session missing; login with seed account |
| 403 on action | Role lacks permission; check matrix |
| Stale UI after API write | Mutation missing invalidate; check hook `onSuccess` |
| Socket never connects | `ENABLE_REALTIME=false` or mocks-only |
