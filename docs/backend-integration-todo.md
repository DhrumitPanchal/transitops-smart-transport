# Backend Integration TODO

This frontend currently runs against an in-memory mock database
(`src/mocks/mockDatabase.js`) when `VITE_USE_MOCKS=true`.

Mock data lives only in memory for the current browser session.
**A full page refresh resets seeded users, credentials, and all domain data.**
That limitation is temporary until the real backend is connected.

---

## Public registration (current frontend)

Flow:

1. User opens `/register`
2. Submits name, email, password, confirm password (no role selection)
3. Mock creates a `PENDING` user with `role: null` and `permissions: []`
4. User is auto-authenticated and redirected to `/dashboard`
5. Pending user sees a waiting-for-approval dashboard only
6. Super Admin approves the user and assigns an operational role
7. Approved user logs out and logs in again in the same mock session to receive
   the active role (separate browser tabs do **not** share mock memory)

Public registration must never create a Super Admin automatically.
Only Super Admin approval may assign:

- `SUPER_ADMIN`
- `FLEET_MANAGER`
- `DISPATCHER`
- `SAFETY_OFFICER`
- `FINANCIAL_ANALYST`

---

## When the backend is ready

Backend (copy `backend/.env.example` → `backend/.env`):

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Frontend:

```env
VITE_USE_MOCKS=false
VITE_ENABLE_REALTIME=true
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

Seeded Super Admin: `admin@transitops.com` / `Admin@123`

---

## Authentication endpoints

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/auth/register` | Public registration. Creates `PENDING` user. Auto-login cookie optional. |
| `POST` | `/auth/login` | Email + password. Secure HTTP-only session cookie. |
| `POST` | `/auth/logout` | Clear session cookie. |
| `GET` | `/auth/me` | Current authenticated user (no password fields). |

### `POST /auth/register` request

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

### Registration requirements

- Validate request.
- Normalize email.
- Enforce unique email.
- Hash password with bcrypt.
- Create user with `PENDING` status.
- Set role / roleId to null.
- Do not assign permissions.
- Return safe user data only.
- Set secure HTTP-only authentication cookie when auto-login is used.
- Never return password hash.
- Emit `user.created` only after database commit (authorized users-management room).

### Login rules

- Invalid email or password → `401` / `INVALID_CREDENTIALS` /
  `Invalid email or password.`
- Inactive user → `403` / `USER_INACTIVE` /
  `Your account is inactive. Contact the administrator.`
- Pending users may log in and receive a limited dashboard.
- Active users resolve permissions from their assigned role.

---

## User management endpoints

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/users` | `users.view` |
| `GET` | `/users/:id` | `users.view` |
| `POST` | `/users` | `users.create` |
| `PUT` | `/users/:id` | `users.edit` |
| `PATCH` | `/users/:id/status` | `users.change_status` |
| `PATCH` | `/users/:id/approve` | `users.change_status` (or dedicated approve permission) |

### `PATCH /users/:id/approve` request

```json
{
  "role": "FINANCIAL_ANALYST"
}
```

### Approval requirements

- Authentication required.
- User-management permission required.
- Target user must be `PENDING`.
- Assign selected role.
- Set status `ACTIVE`.
- Commit transaction.
- Return safe updated user.
- Emit `user.updated` (or `user.status_changed`) after commit.
- Emit `auth.session_changed` one-to-one to `user:{id}`.
- Emit nothing on rollback.
- Never alter or return password hashes.

### Account creation notes

- `POST /users` remains the administrator account-creation endpoint.
- Email must be unique (case-insensitive).
- Status values: `PENDING`, `ACTIVE`, `INACTIVE`.
- Current Super Admin cannot deactivate their own account.
- Do not permanently delete users.

### Initial Super Admin

Seed the database with:

- Email: `admin@transitops.com`
- Role: `SUPER_ADMIN`
- Status: `ACTIVE`
- Every permission assigned

Password is set only via seed / secure ops process — never returned by APIs.

---

## Role management endpoints

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/roles` | `roles.view` |
| `GET` | `/roles/:id` | `roles.view` |
| `PUT` | `/roles/:id/permissions` | `roles.edit_permissions` |

---

## Realtime events

| Event | Purpose |
|-------|---------|
| `user.created` | New pending registration visible to user managers |
| `user.updated` | Profile / role / status updates |
| `user.status_changed` | Status lifecycle changes |
| `auth.session_changed` | One-to-one session refresh for the approved user |

Rules:

- Emit only after successful DB commit.
- Include `eventId`, `occurredAt`, `actorUserId`, and `data`.
- Never include password / passwordHash.
- Use `X-Socket-ID` to exclude the acting client when appropriate.
- Frontend ignores duplicate `eventId` values and updates caches without
  refetching from socket handlers.
- If no live socket exists, next `GET /auth/me` restores correct state.

Do not implement fake sockets while `VITE_USE_MOCKS=true`.

---

## Frontend must not

- Store JWT tokens in browser storage
- Allow public users to choose their own role
- Return or display user passwords
- Depend on socket events while `VITE_USE_MOCKS=true`
- Poll for approval status
