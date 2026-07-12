# Testing checklist

Use mock mode (`EXPO_PUBLIC_USE_MOCKS=true`) unless noted. Seed accounts are in the README.

## Automated

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Smoke Expo start (`npm start`) without redbox on boot

## Auth

- [ ] Login each seed role; lands on correct route
- [ ] Bad password shows error; no crash
- [ ] Register → PENDING user; cannot access gated modules until approved
- [ ] Logout clears session; back navigates to login
- [ ] Unauthorized route shown when opening a URL without permission

## Maintenance

- [ ] List: search, status/type filters, sort, pull-to-refresh, pagination
- [ ] Create blocked message / field error for ON_TRIP or RETIRED vehicle
- [ ] Create OPEN / IN_PROGRESS succeeds; vehicle moves toward IN_SHOP when applicable
- [ ] Detail: status badge, expected end, costs
- [ ] Complete requires completion date + final cost; status COMPLETED
- [ ] Cancel requires reason; status CANCELLED
- [ ] Edit only for OPEN / IN_PROGRESS
- [ ] Buttons hidden without create/edit/complete/cancel permissions (try Dispatcher)

## Fuel

- [ ] List shows cost-per-litre
- [ ] Create with vehicle, litres, cost, date, odometer; optional trip/station/notes
- [ ] Edit updates values; CPL recalculates
- [ ] Delete shows ConfirmModal; removes row after confirm
- [ ] Financial Analyst can CRUD; Safety Officer cannot open module

## Expenses

- [ ] List filters by expense type; search works
- [ ] Create with optional vehicle/trip
- [ ] Edit / delete with confirmation
- [ ] Permission gates for create/edit/delete

## Reports

- [ ] Summary KPIs load (efficiency, utilization, costs, revenue, ROI)
- [ ] Charts render cost breakdown
- [ ] Formulas card readable
- [ ] Date / vehicle / type / region filters change totals
- [ ] Export CSV (Fleet Manager / Finance) opens share sheet
- [ ] Export hidden without `reports.export` (Dispatcher)

## Admin users (Super Admin)

- [ ] Chips: All / Pending / Active / Inactive
- [ ] Create user ACTIVE/INACTIVE with password
- [ ] Pending: Approve with role → ACTIVE; password unchanged
- [ ] Pending: Deactivate → INACTIVE
- [ ] Active ↔ Inactive via changeStatus
- [ ] Cannot approve/deactivate self where backend forbids it
- [ ] Non–Super Admin never sees Users in drawer

## Admin roles

- [ ] Role list opens
- [ ] Detail lists permissions
- [ ] Permissions screen: toggle checkboxes; Super Admin–only keys not grantable to Fleet Manager etc.
- [ ] Save strips Super Admin–only via `stripSuperAdminOnlyPermissions`
- [ ] Super Admin role permissions read-only / locked

## Cross-cutting

- [ ] Empty states show CTA when create allowed
- [ ] Error states retry refetch
- [ ] Loading skeletons/loaders on slow mock delay
- [ ] Accessibility: headers, button labels, back buttons
- [ ] Phone + tablet widths (list cards readable)
- [ ] Android back / iOS swipe back from nested `[id]/edit`

## API mode (optional)

- [ ] `USE_MOCKS=false`; login against live API
- [ ] CRUD one record per module
- [ ] Realtime on: second client sees updates
- [ ] CSV export against live `/reports/export/csv`
