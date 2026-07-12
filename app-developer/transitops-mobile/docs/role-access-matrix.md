# Role access matrix

Permissions are string keys (`module.action`) from `src/constants/permissions.js`.  
Super Admin receives **all** permissions. Other roles use `rolePermissions` defaults (editable in Admin → Roles for non–Super Admin–only keys).

## Legend

| Symbol | Meaning |
|--------|---------|
| ✓ | Granted by default |
| — | Not granted |
| S | Super Admin only (cannot grant to other roles) |

## Matrix

| Permission | Super Admin | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|------------|:-----------:|:-------------:|:----------:|:--------------:|:-----------------:|
| `dashboard.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `users.view` | S | — | — | — | — |
| `users.create` | S | — | — | — | — |
| `users.edit` | S | — | — | — | — |
| `users.change_status` | S | — | — | — | — |
| `users.approve` | S | — | — | — | — |
| `roles.view` | S | — | — | — | — |
| `roles.permissions` | S | — | — | — | — |
| `vehicles.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `vehicles.create` | ✓ | ✓ | — | — | — |
| `vehicles.edit` | ✓ | ✓ | — | — | — |
| `vehicles.retire` | ✓ | ✓ | — | — | — |
| `drivers.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `drivers.create` | ✓ | — | — | ✓ | — |
| `drivers.edit` | ✓ | — | — | ✓ | — |
| `drivers.change_status` | ✓ | — | — | ✓ | — |
| `drivers.suspend` | ✓ | — | — | ✓ | — |
| `trips.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `trips.create` | ✓ | — | ✓ | — | — |
| `trips.edit_draft` | ✓ | — | ✓ | — | — |
| `trips.dispatch` | ✓ | — | ✓ | — | — |
| `trips.complete` | ✓ | — | ✓ | — | — |
| `trips.cancel` | ✓ | — | ✓ | — | — |
| `maintenance.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `maintenance.create` | ✓ | ✓ | — | — | — |
| `maintenance.edit` | ✓ | ✓ | — | — | — |
| `maintenance.complete` | ✓ | ✓ | — | — | — |
| `maintenance.cancel` | ✓ | ✓ | — | — | — |
| `fuel.view` | ✓ | ✓ | ✓ | — | ✓ |
| `fuel.create` | ✓ | — | ✓ | — | ✓ |
| `fuel.edit` | ✓ | — | — | — | ✓ |
| `fuel.delete` | ✓ | — | — | — | ✓ |
| `expenses.view` | ✓ | ✓ | ✓ | — | ✓ |
| `expenses.create` | ✓ | — | ✓ | — | ✓ |
| `expenses.edit` | ✓ | — | — | — | ✓ |
| `expenses.delete` | ✓ | — | — | — | ✓ |
| `reports.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `reports.export` | ✓ | ✓ | — | — | ✓ |

## Landing routes

| Role | Default route |
|------|---------------|
| Super Admin | `/dashboard` |
| Fleet Manager | `/vehicles` |
| Dispatcher | `/trips` |
| Safety Officer | `/drivers` |
| Financial Analyst | `/reports` |

## Screen gates (summary)

| Screen area | View permission | Notable actions |
|-------------|-----------------|-----------------|
| Maintenance | `maintenance.view` | create / edit / complete / cancel |
| Fuel | `fuel.view` | create / edit / delete |
| Expenses | `expenses.view` | create / edit / delete |
| Reports | `reports.view` | export (`reports.export`) |
| Admin users | `users.view` | create / edit / approve / change_status |
| Admin roles | `roles.view` | edit permissions (`roles.permissions`) |

Unauthorized access redirects to `/unauthorized`. Unauthenticated → `/login`. Pending users are redirected to their landing route until approved (cannot use admin tools).
