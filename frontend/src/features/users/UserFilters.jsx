import FilterBar from '../../components/tables/FilterBar'
import SearchInput from '../../components/tables/SearchInput'
import { ROLE_OPTIONS } from '../../constants/roles'
import {
  USER_STATUS_OPTIONS,
  USER_STATUS_OPTIONS_API,
} from '../../constants/statuses'
import { isMockMode } from '../../services/serviceMode'

const selectClassName =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

export default function UserFilters({
  filters,
  onChange,
  onReset,
  roleOptions = ROLE_OPTIONS,
}) {
  const statusOptions = isMockMode()
    ? USER_STATUS_OPTIONS
    : USER_STATUS_OPTIONS_API

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
        <label className="sr-only" htmlFor="user-search">
          Search users
        </label>
        <SearchInput
          id="user-search"
          value={filters.search || ''}
          onChange={(value) => update('search', value)}
          placeholder="Search name or email"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="user-role-filter">
          Role
        </label>
        <select
          id="user-role-filter"
          className={selectClassName}
          value={filters.role || ''}
          onChange={(event) => update('role', event.target.value)}
        >
          <option value="">All roles</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="user-status-filter">
          Status
        </label>
        <select
          id="user-status-filter"
          className={selectClassName}
          value={filters.status || ''}
          onChange={(event) => update('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
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
