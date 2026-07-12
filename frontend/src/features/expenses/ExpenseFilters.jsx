import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'
import { EXPENSE_TYPE_OPTIONS } from '../../constants/appConstants'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function ExpenseFilters({
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
        <label className="sr-only" htmlFor="expense-search">
          Search expenses
        </label>
        <SearchInput
          id="expense-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search description or vehicle"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="expense-type-filter">
          Expense type
        </label>
        <select
          id="expense-type-filter"
          className={selectClassName}
          value={filters.expenseType || ''}
          onChange={(event) => update('expenseType', event.target.value)}
        >
          <option value="">All types</option>
          {EXPENSE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="expense-vehicle-filter">
          Vehicle
        </label>
        <select
          id="expense-vehicle-filter"
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
        <label className="sr-only" htmlFor="expense-trip-filter">
          Trip
        </label>
        <select
          id="expense-trip-filter"
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
        <label className="sr-only" htmlFor="expense-date-from">
          From date
        </label>
        <input
          id="expense-date-from"
          type="date"
          className={selectClassName}
          value={filters.dateFrom || ''}
          onChange={(event) => update('dateFrom', event.target.value)}
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="expense-date-to">
          To date
        </label>
        <input
          id="expense-date-to"
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
