import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
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
  const { isAuthenticated, isLoading, landingRoute } = useAuth()

  if (isLoading) {
    return <PageLoader />
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

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

            <Route path={ROUTES.VEHICLES} element={<VehiclesListPage />} />
            <Route path={ROUTES.VEHICLES_NEW} element={<VehicleCreatePage />} />
            <Route path={ROUTES.VEHICLE_DETAIL} element={<VehicleDetailPage />} />
            <Route path={ROUTES.VEHICLE_EDIT} element={<VehicleEditPage />} />

            <Route path={ROUTES.DRIVERS} element={<DriversListPage />} />
            <Route path={ROUTES.DRIVERS_NEW} element={<DriverCreatePage />} />
            <Route path={ROUTES.DRIVER_DETAIL} element={<DriverDetailPage />} />
            <Route path={ROUTES.DRIVER_EDIT} element={<DriverEditPage />} />

            <Route path={ROUTES.TRIPS} element={<TripsListPage />} />
            <Route path={ROUTES.TRIPS_NEW} element={<TripCreatePage />} />
            <Route path={ROUTES.TRIP_DETAIL} element={<TripDetailPage />} />
            <Route path={ROUTES.TRIP_EDIT} element={<TripEditPage />} />

            <Route path={ROUTES.MAINTENANCE} element={<MaintenanceListPage />} />
            <Route
              path={ROUTES.MAINTENANCE_NEW}
              element={<MaintenanceCreatePage />}
            />
            <Route
              path={ROUTES.MAINTENANCE_DETAIL}
              element={<MaintenanceDetailPage />}
            />
            <Route
              path={ROUTES.MAINTENANCE_EDIT}
              element={<MaintenanceEditPage />}
            />

            <Route path={ROUTES.FUEL} element={<FuelListPage />} />
            <Route path={ROUTES.FUEL_NEW} element={<FuelCreatePage />} />
            <Route path={ROUTES.FUEL_DETAIL} element={<FuelDetailPage />} />
            <Route path={ROUTES.FUEL_EDIT} element={<FuelEditPage />} />

            <Route path={ROUTES.EXPENSES} element={<ExpensesListPage />} />
            <Route path={ROUTES.EXPENSES_NEW} element={<ExpenseCreatePage />} />
            <Route path={ROUTES.EXPENSE_DETAIL} element={<ExpenseDetailPage />} />
            <Route path={ROUTES.EXPENSE_EDIT} element={<ExpenseEditPage />} />

            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

            <Route
              element={<PermissionRoute permission={PERMISSIONS.USERS_VIEW} />}
            >
              <Route path={ROUTES.ADMIN_USERS} element={<UsersListPage />} />
              <Route path={ROUTES.ADMIN_USERS_NEW} element={<UserCreatePage />} />
              <Route
                path={ROUTES.ADMIN_USER_DETAIL}
                element={<UserDetailPage />}
              />
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
