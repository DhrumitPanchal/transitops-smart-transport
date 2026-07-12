import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'
import {
  MAINTENANCE_STATUS_OPTIONS,
} from '../../constants/statuses'
import { MAINTENANCE_TYPE_OPTIONS } from '../../constants/appConstants'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function MaintenanceFilters({
  filters,
  onChange,
  onReset,
  vehicleOptions = [],
}) {
  const update = (key, value) => {
    onChange?.({
      ...filters,
      [key]: value,
      page: 1,
    })
  }

  return (
    <FilterBar>
      <div className="w-full sm:min-w-[220px] sm:flex-1">
        <label className="sr-only" htmlFor="maintenance-search">
          Search maintenance
        </label>
        <SearchInput
          id="maintenance-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search vehicle or description"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="maintenance-status-filter">
          Status
        </label>
        <select
          id="maintenance-status-filter"
          className={selectClassName}
          value={filters.status || ''}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {MAINTENANCE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="maintenance-type-filter">
          Maintenance type
        </label>
        <select
          id="maintenance-type-filter"
          className={selectClassName}
          value={filters.maintenanceType || ''}
          onChange={(event) => update('maintenanceType', event.target.value)}
        >
          <option value="">All types</option>
          {MAINTENANCE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="maintenance-vehicle-filter">
          Vehicle
        </label>
        <select
          id="maintenance-vehicle-filter"
          className={selectClassName}
          value={filters.vehicleId || ''}
          onChange={(event) => update('vehicleId', event.target.value)}
        >
          <option value="">All vehicles</option>
          {vehicleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="maintenance-date-from">
          From date
        </label>
        <input
          id="maintenance-date-from"
          type="date"
          className={selectClassName}
          value={filters.dateFrom || ''}
          onChange={(event) => update('dateFrom', event.target.value)}
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="maintenance-date-to">
          To date
        </label>
        <input
          id="maintenance-date-to"
          type="date"
          className={selectClassName}
          value={filters.dateTo || ''}
          onChange={(event) => update('dateTo', event.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Reset
      </button>
    </FilterBar>
  )
}
