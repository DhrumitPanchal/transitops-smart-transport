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
import { useAuth } from '../hooks/useAuth'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const VehiclesListPage = lazy(() => import('../pages/vehicles/VehiclesListPage'))
const VehicleCreatePage = lazy(() => import('../pages/vehicles/VehicleCreatePage'))
const VehicleDetailPage = lazy(() => import('../pages/vehicles/VehicleDetailPage'))
const VehicleEditPage = lazy(() => import('../pages/vehicles/VehicleEditPage'))
const DriversListPage = lazy(() => import('../pages/drivers/DriversListPage'))
const DriverCreatePage = lazy(() => import('../pages/drivers/DriverCreatePage'))
const DriverDetailPage = lazy(() => import('../pages/drivers/DriverDetailPage'))
const DriverEditPage = lazy(() => import('../pages/drivers/DriverEditPage'))
const TripsListPage = lazy(() => import('../pages/trips/TripsListPage'))
const TripCreatePage = lazy(() => import('../pages/trips/TripCreatePage'))
const TripDetailPage = lazy(() => import('../pages/trips/TripDetailPage'))
const TripEditPage = lazy(() => import('../pages/trips/TripEditPage'))
const MaintenanceListPage = lazy(
  () => import('../pages/maintenance/MaintenanceListPage'),
)
const MaintenanceCreatePage = lazy(
  () => import('../pages/maintenance/MaintenanceCreatePage'),
)
const MaintenanceDetailPage = lazy(
  () => import('../pages/maintenance/MaintenanceDetailPage'),
)
const MaintenanceEditPage = lazy(
  () => import('../pages/maintenance/MaintenanceEditPage'),
)
const FuelListPage = lazy(() => import('../pages/fuel/FuelListPage'))
const FuelCreatePage = lazy(() => import('../pages/fuel/FuelCreatePage'))
const FuelDetailPage = lazy(() => import('../pages/fuel/FuelDetailPage'))
const FuelEditPage = lazy(() => import('../pages/fuel/FuelEditPage'))
const ExpensesListPage = lazy(() => import('../pages/expenses/ExpensesListPage'))
const ExpenseCreatePage = lazy(() => import('../pages/expenses/ExpenseCreatePage'))
const ExpenseDetailPage = lazy(() => import('../pages/expenses/ExpenseDetailPage'))
const ExpenseEditPage = lazy(() => import('../pages/expenses/ExpenseEditPage'))
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'))
const UsersListPage = lazy(() => import('../pages/users/UsersListPage'))
const UserCreatePage = lazy(() => import('../pages/users/UserCreatePage'))
const UserDetailPage = lazy(() => import('../pages/users/UserDetailPage'))
const UserEditPage = lazy(() => import('../pages/users/UserEditPage'))
const RolesListPage = lazy(() => import('../pages/roles/RolesListPage'))
const RoleDetailPage = lazy(() => import('../pages/roles/RoleDetailPage'))
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
              <Route path={ROUTES.VEHICLES} element={<VehiclesListPage />} />
              <Route
                path={ROUTES.VEHICLE_DETAIL}
                element={<VehicleDetailPage />}
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
              <Route path={ROUTES.DRIVERS} element={<DriversListPage />} />
              <Route path={ROUTES.DRIVER_DETAIL} element={<DriverDetailPage />} />
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
              <Route path={ROUTES.TRIPS} element={<TripsListPage />} />
              <Route path={ROUTES.TRIP_DETAIL} element={<TripDetailPage />} />
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
                element={<MaintenanceDetailPage />}
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
              <Route path={ROUTES.FUEL} element={<FuelListPage />} />
              <Route path={ROUTES.FUEL_DETAIL} element={<FuelDetailPage />} />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.FUEL_CREATE} />}
            >
              <Route path={ROUTES.FUEL_NEW} element={<FuelCreatePage />} />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.FUEL_EDIT} />}
            >
              <Route path={ROUTES.FUEL_EDIT} element={<FuelEditPage />} />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.EXPENSES_VIEW} />
              }
            >
              <Route path={ROUTES.EXPENSES} element={<ExpensesListPage />} />
              <Route
                path={ROUTES.EXPENSE_DETAIL}
                element={<ExpenseDetailPage />}
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
              element={<PermissionRoute permission={PERMISSIONS.USERS_VIEW} />}
            >
              <Route path={ROUTES.ADMIN_USERS} element={<UsersListPage />} />
              <Route
                path={ROUTES.ADMIN_USER_DETAIL}
                element={<UserDetailPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute permission={PERMISSIONS.USERS_CREATE} />
              }
            >
              <Route
                path={ROUTES.ADMIN_USERS_NEW}
                element={<UserCreatePage />}
              />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.USERS_EDIT} />}
            >
              <Route path={ROUTES.ADMIN_USER_EDIT} element={<UserEditPage />} />
            </Route>

            <Route
              element={<PermissionRoute permission={PERMISSIONS.ROLES_VIEW} />}
            >
              <Route path={ROUTES.ADMIN_ROLES} element={<RolesListPage />} />
              <Route
                path={ROUTES.ADMIN_ROLE_DETAIL}
                element={<RoleDetailPage />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  permission={PERMISSIONS.ROLES_EDIT_PERMISSIONS}
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
