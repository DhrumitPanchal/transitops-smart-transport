import { ROLE_LABELS } from '../constants/roles'
import {
  mapListResponse,
  mapSingleResponse,
  toApiBody,
  toApiParams,
} from './apiEnvelope'
import { keysToCamelCase } from './caseMapper'

const LABEL_TO_ROLE_CODE = Object.entries(ROLE_LABELS).reduce(
  (acc, [code, label]) => {
    acc[String(label).toLowerCase()] = code
    return acc
  },
  {},
)

/**
 * Backend auth/user role is `{ id, name }` (name = display label, not code).
 * Frontend session/UI expects a role code string (e.g. SUPER_ADMIN).
 */
export function resolveRoleCode(role) {
  if (role == null || role === '') return null
  if (typeof role === 'string') {
    const trimmed = role.trim()
    if (!trimmed) return null
    if (/^[A-Z0-9_]+$/.test(trimmed)) return trimmed
    return LABEL_TO_ROLE_CODE[trimmed.toLowerCase()] || trimmed
  }

  if (typeof role === 'object') {
    if (role.code && typeof role.code === 'string') {
      return resolveRoleCode(role.code)
    }
    if (role.key && typeof role.key === 'string') {
      return resolveRoleCode(role.key)
    }
    if (role.name && typeof role.name === 'string') {
      return resolveRoleCode(role.name)
    }
  }

  return null
}

function buildDisplayName(entity) {
  if (entity.name && String(entity.name).trim()) {
    return String(entity.name).trim()
  }
  return [entity.firstName, entity.lastName].filter(Boolean).join(' ').trim()
}

/**
 * Normalize backend / mock user into the frontend public user shape.
 */
export function fromApi(entity) {
  if (entity == null) return entity
  const mapped = keysToCamelCase(entity)
  if (!mapped || typeof mapped !== 'object') return mapped

  const roleCode = resolveRoleCode(mapped.role)
  const safe = {
    ...mapped,
    name: buildDisplayName(mapped),
    role: roleCode,
    roleId: mapped.roleId ?? mapped.role?.id ?? null,
    roleMeta:
      mapped.role && typeof mapped.role === 'object'
        ? {
            id: mapped.role.id ?? mapped.roleId ?? null,
            name: mapped.role.name ?? null,
            code: roleCode,
          }
        : roleCode
          ? { id: mapped.roleId ?? null, name: null, code: roleCode }
          : null,
    permissions: Array.isArray(mapped.permissions) ? mapped.permissions : [],
  }

  delete safe.password
  delete safe.passwordHash
  delete safe.confirmPassword

  return safe
}

export function toApi(entity) {
  if (entity == null) return entity
  return entity
}

export function fromApiList(payload) {
  return mapListResponse(payload, fromApi)
}

export function fromApiDetail(payload) {
  return mapSingleResponse(payload, fromApi)
}

export function toApiRequest(payload) {
  return toApiBody(payload)
}

/**
 * Map list filters to backend GET /users query.
 * Backend accepts: page, limit, roleId, status (+ search/sortBy/sortOrder in service).
 */
export function toApiQuery(params = {}) {
  const query = toApiParams(params)

  if (query.sortBy === 'name') {
    query.sortBy = 'firstName'
  }

  // Backend filters by roleId (UUID), not role code string.
  if (query.role && !query.roleId) {
    delete query.role
  } else if (query.role) {
    delete query.role
  }

  // Backend status enum: ACTIVE | INACTIVE only
  if (query.status === 'PENDING') {
    delete query.status
  }

  return query
}
