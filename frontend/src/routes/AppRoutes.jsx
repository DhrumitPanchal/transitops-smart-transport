import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import PermissionRoute from './PermissionRoute'
import PageLoader from '../components/feedback/PageLoader'
import { ROUTES } from '../constants/routes'
import { PERMISSIONS } from '../constants/permissions'
import { ROLES } from '../constants/roles'
import { useAuth } from '../hooks/useAuth'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const VehicleListPage = lazy(() => import('../pages/vehicles/VehicleListPage'))
const VehicleCreatePage = lazy(() => import('../pages/vehicles/VehicleCreatePage'))
const VehicleDetailsPage = lazy(
  () => import('../pages/vehicles/VehicleDetailsPage'),
)
const VehicleEditPage = lazy(() => import('../pages/vehicles/VehicleEditPage'))
const DriverListPage = lazy(() => import('../pages/drivers/DriverListPage'))
const DriverCreatePage = lazy(() => import('../pages/drivers/DriverCreatePage'))
const DriverDetailsPage = lazy(() => import('../pages/drivers/DriverDetailsPage'))
const DriverEditPage = lazy(() => import('../pages/drivers/DriverEditPage'))
const TripListPage = lazy(() => import('../pages/trips/TripListPage'))
const TripCreatePage = lazy(() => import('../pages/trips/TripCreatePage'))
const TripDetailsPage = lazy(() => import('../pages/trips/TripDetailsPage'))
const TripEditPage = lazy(() => import('../pages/trips/TripEditPage'))
const MaintenanceListPage = lazy(
  () => import('../pages/maintenance/MaintenanceListPage'),
)
const MaintenanceCreatePage = lazy(
  () => import('../pages/maintenance/MaintenanceCreatePage'),
)
const MaintenanceDetailsPage = lazy(
  () => import('../pages/maintenance/MaintenanceDetailsPage'),
)
const MaintenanceEditPage = lazy(
  () => import('../pages/maintenance/MaintenanceEditPage'),
)
const FuelLogListPage = lazy(() => import('../pages/fuel/FuelLogListPage'))
const FuelLogCreatePage = lazy(() => import('../pages/fuel/FuelLogCreatePage'))
const FuelLogDetailsPage = lazy(
  () => import('../pages/fuel/FuelLogDetailsPage'),
)
const FuelLogEditPage = lazy(() => import('../pages/fuel/FuelLogEditPage'))
const ExpenseListPage = lazy(() => import('../pages/expenses/ExpenseListPage'))
const ExpenseCreatePage = lazy(
  () => import('../pages/expenses/ExpenseCreatePage'),
)
const ExpenseDetailsPage = lazy(
  () => import('../pages/expenses/ExpenseDetailsPage'),
)
const ExpenseEditPage = lazy(() => import('../pages/expenses/ExpenseEditPage'))
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'))
const UserListPage = lazy(() => import('../pages/users/UserListPage'))
const UserCreatePage = lazy(() => import('../pages/users/UserCreatePage'))
const UserDetailsPage = lazy(() => import('../pages/users/UserDetailsPage'))
const UserEditPage = lazy(() => import('../pages/users/UserEditPage'))
const RoleListPage = lazy(() => import('../pages/roles/RoleListPage'))
const RoleDetailsPage = lazy(() => import('../pages/roles/RoleDetailsPage'))
const RolePermissionsPage = lazy(
  () => import('../pages/roles/RolePermissionsPage'),
)
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

function RootRedirect() {
  const { isAuthenticated, isInitializing, landingRoute } = useAuth()

  if (isInitializing) {
    return <PageLoader label="Checking session..." />
  }

  return (
    <Navigate to={isAuthenticated ? landingRoute : ROUTES.LOGIN} replace />
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW} />
              }
            >
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.VEHICLES_VIEW} />
              }
            >
              <Route path={ROUTES.VEHICLES} element={<VehicleListPage />} />
              <Route
                path={ROUTES.VEHICLE_DETAIL}
                element={<VehicleDetailsPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.VEHICLES_CREATE} />
              }
            >
              <Route
                path={ROUTES.VEHICLES_NEW}
                element={<VehicleCreatePage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.VEHICLES_EDIT} />
              }
            >
              <Route path={ROUTES.VEHICLE_EDIT} element={<VehicleEditPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.DRIVERS_VIEW} />
              }
            >
              <Route path={ROUTES.DRIVERS} element={<DriverListPage />} />
              <Route
                path={ROUTES.DRIVER_DETAIL}
                element={<DriverDetailsPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.DRIVERS_CREATE} />
              }
            >
              <Route path={ROUTES.DRIVERS_NEW} element={<DriverCreatePage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.DRIVERS_EDIT} />
              }
            >
              <Route path={ROUTES.DRIVER_EDIT} element={<DriverEditPage />} />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.TRIPS_VIEW} />}
            >
              <Route path={ROUTES.TRIPS} element={<TripListPage />} />
              <Route path={ROUTES.TRIP_DETAIL} element={<TripDetailsPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.TRIPS_CREATE} />
              }
            >
              <Route path={ROUTES.TRIPS_NEW} element={<TripCreatePage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.TRIPS_EDIT_DRAFT} />
              }
            >
              <Route path={ROUTES.TRIP_EDIT} element={<TripEditPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.MAINTENANCE_VIEW} />
              }
            >
              <Route
                path={ROUTES.MAINTENANCE}
                element={<MaintenanceListPage />}
              />
              <Route
                path={ROUTES.MAINTENANCE_DETAIL}
                element={<MaintenanceDetailsPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.MAINTENANCE_CREATE} />
              }
            >
              <Route
                path={ROUTES.MAINTENANCE_NEW}
                element={<MaintenanceCreatePage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.MAINTENANCE_EDIT} />
              }
            >
              <Route
                path={ROUTES.MAINTENANCE_EDIT}
                element={<MaintenanceEditPage />}
              />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.FUEL_VIEW} />}
            >
              <Route path={ROUTES.FUEL} element={<FuelLogListPage />} />
              <Route
                path={ROUTES.FUEL_DETAIL}
                element={<FuelLogDetailsPage />}
              />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.FUEL_CREATE} />}
            >
              <Route path={ROUTES.FUEL_NEW} element={<FuelLogCreatePage />} />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.FUEL_EDIT} />}
            >
              <Route path={ROUTES.FUEL_EDIT} element={<FuelLogEditPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.EXPENSES_VIEW} />
              }
            >
              <Route path={ROUTES.EXPENSES} element={<ExpenseListPage />} />
              <Route
                path={ROUTES.EXPENSE_DETAIL}
                element={<ExpenseDetailsPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.EXPENSES_CREATE} />
              }
            >
              <Route
                path={ROUTES.EXPENSES_NEW}
                element={<ExpenseCreatePage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.EXPENSES_EDIT} />
              }
            >
              <Route path={ROUTES.EXPENSE_EDIT} element={<ExpenseEditPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW} />
              }
            >
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission={PERMISSIONS.USERS_VIEW}
                  roles={[ROLES.SUPER_ADMIN]}
                />
              }
            >
              <Route path={ROUTES.ADMIN_USERS} element={<UserListPage />} />
              <Route
                path={ROUTES.ADMIN_USER_DETAIL}
                element={<UserDetailsPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission={PERMISSIONS.USERS_CREATE}
                  roles={[ROLES.SUPER_ADMIN]}
                />
              }
            >
              <Route
                path={ROUTES.ADMIN_USERS_NEW}
                element={<UserCreatePage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission={PERMISSIONS.USERS_EDIT}
                  roles={[ROLES.SUPER_ADMIN]}
                />
              }
            >
              <Route path={ROUTES.ADMIN_USER_EDIT} element={<UserEditPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission={PERMISSIONS.ROLES_VIEW}
                  roles={[ROLES.SUPER_ADMIN]}
                />
              }
            >
              <Route path={ROUTES.ADMIN_ROLES} element={<RoleListPage />} />
              <Route
                path={ROUTES.ADMIN_ROLE_DETAIL}
                element={<RoleDetailsPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission={PERMISSIONS.ROLES_EDIT_PERMISSIONS}
                  roles={[ROLES.SUPER_ADMIN]}
                />
              }
            >
              <Route
                path={ROUTES.ADMIN_ROLE_PERMISSIONS}
                element={<RolePermissionsPage />}
              />
            </Route>
          </Route>
        </Route>

        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
