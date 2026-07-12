import FilterBar from '../../components/tables/FilterBar'
import { VEHICLE_TYPE_OPTIONS } from '../../constants/appConstants'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function ReportFilters({
  filters,
  onChange,
  onReset,
  vehicleOptions = [],
  regionOptions = [],
}) {
  const update = (key, value) => {
    onChange?.({
      ...filters,
      [key]: value,
    })
  }

  return (
    <FilterBar>
      <div>
        <label className="sr-only" htmlFor="report-vehicle-filter">
          Vehicle
        </label>
        <select
          id="report-vehicle-filter"
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
        <label className="sr-only" htmlFor="report-vehicle-type-filter">
          Vehicle type
        </label>
        <select
          id="report-vehicle-type-filter"
          className={selectClassName}
          value={filters.vehicleType || ''}
          onChange={(event) => update('vehicleType', event.target.value)}
        >
          <option value="">All types</option>
          {VEHICLE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="report-region-filter">
          Region
        </label>
        <select
          id="report-region-filter"
          className={selectClassName}
          value={filters.region || ''}
          onChange={(event) => update('region', event.target.value)}
        >
          <option value="">All regions</option>
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="report-date-from">
          From date
        </label>
        <input
          id="report-date-from"
          type="date"
          className={selectClassName}
          value={filters.dateFrom || ''}
          onChange={(event) => update('dateFrom', event.target.value)}
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="report-date-to">
          To date
        </label>
        <input
          id="report-date-to"
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
