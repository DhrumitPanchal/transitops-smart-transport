import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function FuelLogFilters({
  filters,
  onChange,
  onReset,
  vehicleOptions = [],
  tripOptions = [],
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
        <label className="sr-only" htmlFor="fuel-search">
          Search fuel logs
        </label>
        <SearchInput
          id="fuel-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search station, vehicle, or notes"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="fuel-vehicle-filter">
          Vehicle
        </label>
        <select
          id="fuel-vehicle-filter"
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
        <label className="sr-only" htmlFor="fuel-trip-filter">
          Trip
        </label>
        <select
          id="fuel-trip-filter"
          className={selectClassName}
          value={filters.tripId || ''}
          onChange={(event) => update('tripId', event.target.value)}
        >
          <option value="">All trips</option>
          {tripOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="fuel-date-from">
          From date
        </label>
        <input
          id="fuel-date-from"
          type="date"
          className={selectClassName}
          value={filters.dateFrom || ''}
          onChange={(event) => update('dateFrom', event.target.value)}
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="fuel-date-to">
          To date
        </label>
        <input
          id="fuel-date-to"
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
