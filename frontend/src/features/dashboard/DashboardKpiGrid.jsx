import {
  Bus,
  Fuel,
  Gauge,
  IndianRupee,
  ShieldAlert,
  Truck,
  Users,
  Wrench,
  Route,
} from 'lucide-react'
import KpiCard from '../../components/common/KpiCard'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { DASHBOARD_KPI_KEYS } from './dashboardRoleConfig'

const KPI_META = {
  [DASHBOARD_KPI_KEYS.ACTIVE_VEHICLES]: {
    title: 'Active Vehicles',
    icon: Truck,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.AVAILABLE_VEHICLES]: {
    title: 'Available Vehicles',
    icon: Bus,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.VEHICLES_ON_TRIP]: {
    title: 'Vehicles On Trip',
    icon: Route,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.VEHICLES_IN_MAINTENANCE]: {
    title: 'Vehicles In Maintenance',
    icon: Wrench,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.ACTIVE_TRIPS]: {
    title: 'Active Trips',
    icon: Route,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.PENDING_TRIPS]: {
    title: 'Pending Trips',
    icon: Route,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.DRIVERS_ON_DUTY]: {
    title: 'Drivers On Duty',
    icon: Users,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.AVAILABLE_DRIVERS]: {
    title: 'Available Drivers',
    icon: Users,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.FLEET_UTILIZATION]: {
    title: 'Fleet Utilization',
    icon: Gauge,
    format: (value) => `${formatNumber(value)}%`,
  },
  [DASHBOARD_KPI_KEYS.TOTAL_OPERATIONAL_COST]: {
    title: 'Total Operational Cost',
    icon: IndianRupee,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.FUEL_COST]: {
    title: 'Fuel Cost',
    icon: Fuel,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.MAINTENANCE_COST]: {
    title: 'Maintenance Cost',
    icon: Wrench,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.EXPENSES]: {
    title: 'Expenses',
    icon: IndianRupee,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.REVENUE]: {
    title: 'Revenue',
    icon: IndianRupee,
    format: (value) => formatCurrency(value),
  },
  [DASHBOARD_KPI_KEYS.VEHICLE_ROI]: {
    title: 'Vehicle ROI',
    icon: Gauge,
    format: (value) => `${formatNumber(value)}%`,
  },
  [DASHBOARD_KPI_KEYS.FUEL_EFFICIENCY]: {
    title: 'Fuel Efficiency',
    icon: Fuel,
    format: (value) => `${formatNumber(value)} km/L`,
  },
  [DASHBOARD_KPI_KEYS.EXPIRED_LICENCES]: {
    title: 'Expired Licences',
    icon: ShieldAlert,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.EXPIRING_LICENCES]: {
    title: 'Expiring Licences',
    icon: ShieldAlert,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.SUSPENDED_DRIVERS]: {
    title: 'Suspended Drivers',
    icon: ShieldAlert,
    format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
  },
  [DASHBOARD_KPI_KEYS.AVERAGE_SAFETY_SCORE]: {
    title: 'Avg Safety Score',
    icon: ShieldAlert,
    format: (value) => formatNumber(value),
  },
}

export default function DashboardKpiGrid({ kpis = {}, visibleKeys = [] }) {
  if (!visibleKeys.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {visibleKeys.map((key) => {
        const meta = KPI_META[key]
        if (!meta) return null
        const raw = kpis?.[key]
        return (
          <KpiCard
            key={key}
            title={meta.title}
            value={meta.format(raw)}
            icon={meta.icon}
          />
        )
      })}
    </div>
  )
}
