import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../../components/common/Card'
import SectionTitle from '../../components/common/SectionTitle'
import { STATUS_LABELS } from '../../constants/statuses'
import { formatCurrency } from '../../utils/formatters'

const PIE_COLORS = ['#0f766e', '#0369a1', '#b45309', '#be123c', '#4b5563']

function ChartCard({ title, description, children }) {
  return (
    <Card>
      <SectionTitle title={title} description={description} />
      <div className="mt-4 h-64 w-full">{children}</div>
    </Card>
  )
}

function StatusPie({ data = [], title, description }) {
  const chartData = data
    .filter((item) => Number(item.value) > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status] || item.label || item.status,
      value: Number(item.value) || 0,
    }))

  if (!chartData.length) {
    return (
      <ChartCard title={title} description={description}>
        <p className="flex h-full items-center justify-center text-sm text-slate-500">
          No data yet
        </p>
      </ChartCard>
    )
  }

  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function MonthlyBar({ data = [], title, description }) {
  const chartData = (data || []).map((item) => ({
    label: item.label || item.month,
    value: Number(item.value) || 0,
  }))

  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ExpenseBreakdown({ data = [] }) {
  const chartData = (data || []).map((item) => ({
    name: item.label || item.type,
    value: Number(item.value) || 0,
  }))

  if (!chartData.length) {
    return (
      <ChartCard
        title="Expense breakdown"
        description="Spend by expense type."
      >
        <p className="flex h-full items-center justify-center text-sm text-slate-500">
          No expenses yet
        </p>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Expense breakdown" description="Spend by expense type.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={80}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default function DashboardCharts({ charts = {}, visibleCharts = [] }) {
  if (!visibleCharts.length) return null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {visibleCharts.includes('vehicleStatusDistribution') ? (
        <StatusPie
          title="Vehicle status distribution"
          description="Current fleet status mix."
          data={charts.vehicleStatusDistribution}
        />
      ) : null}
      {visibleCharts.includes('tripStatusDistribution') ? (
        <StatusPie
          title="Trip status distribution"
          description="Operational trip pipeline."
          data={charts.tripStatusDistribution}
        />
      ) : null}
      {visibleCharts.includes('monthlyFuelCost') ? (
        <MonthlyBar
          title="Monthly fuel cost"
          description="Fuel spend over recent months."
          data={charts.monthlyFuelCost}
        />
      ) : null}
      {visibleCharts.includes('monthlyMaintenanceCost') ? (
        <MonthlyBar
          title="Monthly maintenance cost"
          description="Shop spend over recent months."
          data={charts.monthlyMaintenanceCost}
        />
      ) : null}
      {visibleCharts.includes('expenseBreakdown') ? (
        <ExpenseBreakdown data={charts.expenseBreakdown} />
      ) : null}
    </div>
  )
}
