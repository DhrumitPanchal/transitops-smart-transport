function toCamelKey(key) {
  return String(key).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toSnakeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, '_$1')
    .replace(/-/g, '_')
    .toLowerCase()
}

export function keysToCamelCase(value) {
  if (Array.isArray(value)) {
    return value.map((item) => keysToCamelCase(item))
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).reduce((result, [key, nestedValue]) => {
      result[toCamelKey(key)] = keysToCamelCase(nestedValue)
      return result
    }, {})
  }

  return value
}

export function keysToSnakeCase(value) {
  if (Array.isArray(value)) {
    return value.map((item) => keysToSnakeCase(item))
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).reduce((result, [key, nestedValue]) => {
      result[toSnakeKey(key)] = keysToSnakeCase(nestedValue)
      return result
    }, {})
  }

  return value
}
