import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'
import { VEHICLE_TYPE_OPTIONS } from '../../constants/appConstants'
import { VEHICLE_STATUS_OPTIONS } from '../../constants/statuses'
import { VEHICLE_REGION_OPTIONS } from './vehicleFormDefaults'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function VehicleFilters({
  filters,
  onChange,
  onReset,
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
        <label className="sr-only" htmlFor="vehicle-search">
          Search vehicles
        </label>
        <SearchInput
          id="vehicle-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search registration, name, or model"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="vehicle-type-filter">
          Vehicle type
        </label>
        <select
          id="vehicle-type-filter"
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
        <label className="sr-only" htmlFor="vehicle-status-filter">
          Status
        </label>
        <select
          id="vehicle-status-filter"
          className={selectClassName}
          value={filters.status || ''}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {VEHICLE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="vehicle-region-filter">
          Region
        </label>
        <select
          id="vehicle-region-filter"
          className={selectClassName}
          value={filters.region || ''}
          onChange={(event) => update('region', event.target.value)}
        >
          <option value="">All regions</option>
          {VEHICLE_REGION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
