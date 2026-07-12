import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'
import { TRIP_STATUS_OPTIONS } from '../../constants/statuses'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function TripFilters({
  filters,
  onChange,
  onReset,
  vehicleOptions = [],
  driverOptions = [],
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
        <label className="sr-only" htmlFor="trip-search">
          Search trips
        </label>
        <SearchInput
          id="trip-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search trip number, source, or destination"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="trip-status-filter">
          Status
        </label>
        <select
          id="trip-status-filter"
          className={selectClassName}
          value={filters.status || ''}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {TRIP_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="trip-vehicle-filter">
          Vehicle
        </label>
        <select
          id="trip-vehicle-filter"
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
        <label className="sr-only" htmlFor="trip-driver-filter">
          Driver
        </label>
        <select
          id="trip-driver-filter"
          className={selectClassName}
          value={filters.driverId || ''}
          onChange={(event) => update('driverId', event.target.value)}
        >
          <option value="">All drivers</option>
          {driverOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="trip-date-from">
          From date
        </label>
        <input
          id="trip-date-from"
          type="date"
          className={selectClassName}
          value={filters.dateFrom || ''}
          onChange={(event) => update('dateFrom', event.target.value)}
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="trip-date-to">
          To date
        </label>
        <input
          id="trip-date-to"
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
