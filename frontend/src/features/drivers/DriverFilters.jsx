import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'
import { LICENCE_CATEGORY_OPTIONS } from '../../constants/appConstants'
import { DRIVER_STATUS_OPTIONS } from '../../constants/statuses'
import { LICENSE_CONDITION_OPTIONS } from './doesDriverMatchFilters'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function DriverFilters({ filters, onChange, onReset }) {
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
        <label className="sr-only" htmlFor="driver-search">
          Search drivers
        </label>
        <SearchInput
          id="driver-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search name, licence, or contact"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="driver-status-filter">
          Status
        </label>
        <select
          id="driver-status-filter"
          className={selectClassName}
          value={filters.status || ''}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {DRIVER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="driver-category-filter">
          Licence category
        </label>
        <select
          id="driver-category-filter"
          className={selectClassName}
          value={filters.licenseCategory || ''}
          onChange={(event) => update('licenseCategory', event.target.value)}
        >
          <option value="">All categories</option>
          {LICENCE_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="driver-licence-condition-filter">
          Licence condition
        </label>
        <select
          id="driver-licence-condition-filter"
          className={selectClassName}
          value={filters.licenseCondition || ''}
          onChange={(event) => update('licenseCondition', event.target.value)}
        >
          <option value="">All licence conditions</option>
          {LICENSE_CONDITION_OPTIONS.map((option) => (
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
