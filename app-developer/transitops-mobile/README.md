# TransitOps Mobile

Expo Router (SDK 57) mobile client for TransitOps Smart Transport — fleet vehicles, drivers, trips, maintenance, fuel, expenses, reports, and Super Admin user/role management.

Teal primary (`#0f766e`). JavaScript/JSX only. Works offline-first against in-app mocks; switch to the Nest/Express API with env flags.

## Requirements

- Node.js 20+
- npm 10+
- Expo Go (device) or iOS Simulator / Android Emulator
- Optional: EAS CLI for builds (`npm i -g eas-cli`)

## Installation

```bash
cd app-developer/transitops-mobile
npm install
cp .env.example .env
npm start
```

Then press `i` (iOS), `a` (Android), or scan the QR code with Expo Go.

| Script | Purpose |
|--------|---------|
| `npm start` | Expo dev server |
| `npm run ios` | Open iOS simulator |
| `npm run android` | Open Android emulator |
| `npm run web` | Expo web |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |
| `npm run export` | Static export |

## Environment

Copy `.env.example` → `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_APP_NAME` | `TransitOps` | App display name |
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:5000/api/v1` | REST base URL |
| `EXPO_PUBLIC_SOCKET_URL` | `http://localhost:5000` | Socket.IO origin |
| `EXPO_PUBLIC_USE_MOCKS` | `true` | Use mock repositories (no backend) |
| `EXPO_PUBLIC_ENABLE_REALTIME` | `false` | Connect Socket.IO when authenticated |
| `EXPO_PUBLIC_AUTH_MODE` | `bearer` | Auth header mode |
| `EXPO_PUBLIC_REQUEST_TIMEOUT` | `15000` | Axios timeout (ms) |

**Android emulator tip:** use `http://10.0.2.2:5000/...` instead of `localhost`.  
**Physical device tip:** use your machine’s LAN IP (same Wi‑Fi).

## Mock accounts

When `EXPO_PUBLIC_USE_MOCKS=true`:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@transitops.com` | `Admin@123` |
| Fleet Manager | `fleet@transitops.com` | `Fleet@123` |
| Dispatcher | `dispatcher@transitops.com` | `Dispatcher@123` |
| Safety Officer | `safety@transitops.com` | `Safety@123` |
| Financial Analyst | `finance@transitops.com` | `Finance@123` |

Register creates a **PENDING** user; Super Admin approves with a role (password unchanged).

## Core flows

1. **Auth** — Login / register → role landing route (dashboard, vehicles, trips, drivers, or reports).
2. **Vehicles** — CRUD; retire when not ON_TRIP; status driven by trips/maintenance.
3. **Drivers** — CRUD; suspend / status changes; licence awareness.
4. **Trips** — Draft → dispatch → complete / cancel; assigns vehicle + driver.
5. **Maintenance** — Create only for non-ON_TRIP / non-RETIRED vehicles; complete (final cost) / cancel (reason).
6. **Fuel** — Logs with litres, cost, odometer; cost-per-litre shown; delete with confirm.
7. **Expenses** — Optional vehicle/trip; typed amounts; delete with confirm.
8. **Reports** — KPI summary, charts, formulas; CSV export + system share (`reports.export`).
9. **Admin users** — Filter All/Pending/Active/Inactive; approve pending (role select); activate/deactivate.
10. **Admin roles** — View permissions; edit checkboxes (Super Admin–only permissions stripped for other roles).

See [docs/role-access-matrix.md](docs/role-access-matrix.md) for permission gates.

## Android & iOS

```bash
npm run android   # emulator or connected device
npm run ios       # macOS + Xcode simulator
```

- Gesture handler + Reanimated are configured in Babel (`react-native-reanimated/plugin` last).
- Secure session tokens use `expo-secure-store`.
- CSV share uses `expo-file-system` + `expo-sharing`.

## Tests

```bash
npm test
npm test -- --watch
```

Jest (`jest-expo`) covers validations, RBAC, calculations, realtime guards, and domain helpers under `__tests__/`. Use [docs/testing-checklist.md](docs/testing-checklist.md) for manual QA.

## Mock → live API

1. Set `EXPO_PUBLIC_USE_MOCKS=false`.
2. Point `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_SOCKET_URL` at your backend.
3. Restart Expo (`r` in terminal) so env is reloaded.
4. Sign in with a real backend user (seeded or registered).

Services (`src/services/*`) choose mock repositories vs `apiClient` via `isMockMode()`. Mappers normalize list/detail envelopes. Details: [docs/backend-integration.md](docs/backend-integration.md).

## Realtime (Socket.IO)

1. Backend socket server running.
2. `EXPO_PUBLIC_ENABLE_REALTIME=true` and `USE_MOCKS=false` (or mocks that still emit — typically API mode).
3. Authenticated session attaches the socket; handlers invalidate/patch TanStack Query caches.

Event catalogue: [docs/realtime-events.md](docs/realtime-events.md).

## EAS Build

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

Ensure `app.json` / `eas.json` bundle IDs match (`com.transitops.mobile`). Inject production env via EAS secrets (`EXPO_PUBLIC_*`). Do not ship with `USE_MOCKS=true`.

## Project layout

```
app/                    Expo Router screens (auth + app groups)
src/
  api/                  Axios client, endpoints, errors
  components/           UI kit (forms, lists, charts, feedback)
  constants/            Routes, permissions, statuses, options
  context/              Auth + realtime providers
  hooks/                Domain React Query hooks
  mappers/              API ↔ UI envelopes
  mocks/                Seed DB + repositories
  realtime/             Socket client + cache handlers
  services/             Mock/API service facade
  theme/                Teal design tokens
  utils/                Formatters, CSV, calculations
  validations/          Zod schemas
docs/                   Architecture & integration guides
```

## Further reading

- [docs/mobile-architecture.md](docs/mobile-architecture.md)
- [docs/backend-integration.md](docs/backend-integration.md)
- [docs/realtime-events.md](docs/realtime-events.md)
- [docs/role-access-matrix.md](docs/role-access-matrix.md)
- [docs/testing-checklist.md](docs/testing-checklist.md)

## License

See [LICENSE](LICENSE).
