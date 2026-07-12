function cloneShallow(value) {
  if (Array.isArray(value)) {
    return [...value]
  }

  if (value && typeof value === 'object') {
    return { ...value }
  }

  return value
}

function getItemId(item) {
  if (!item || typeof item !== 'object') return undefined
  if (item.id != null) return String(item.id)
  if (item._id != null) return String(item._id)
  return undefined
}

export function upsertItemById(items = [], item) {
  const nextItem = cloneShallow(item)
  const itemId = getItemId(nextItem)

  if (!itemId) {
    return [...items, nextItem]
  }

  const index = items.findIndex((entry) => getItemId(entry) === itemId)

  if (index === -1) {
    return [...items, nextItem]
  }

  const nextItems = [...items]
  nextItems[index] = { ...items[index], ...nextItem }
  return nextItems
}

export function updateItemById(items = [], item) {
  const nextItem = cloneShallow(item)
  const itemId = getItemId(nextItem)

  if (!itemId) {
    return [...items]
  }

  const index = items.findIndex((entry) => getItemId(entry) === itemId)

  if (index === -1) {
    return [...items]
  }

  const nextItems = [...items]
  nextItems[index] = { ...items[index], ...nextItem }
  return nextItems
}

export function removeItemById(items = [], id) {
  const targetId = id == null ? undefined : String(id)
  if (!targetId) return [...items]
  return items.filter((entry) => getItemId(entry) !== targetId)
}

function getListItems(data) {
  if (!data || typeof data !== 'object') return null

  if (Array.isArray(data.data)) {
    return {
      shape: 'flat',
      items: data.data,
      pagination: data.pagination,
    }
  }

  if (data.data && typeof data.data === 'object' && Array.isArray(data.data.items)) {
    return {
      shape: 'nested',
      items: data.data.items,
      pagination: data.data.pagination ?? data.pagination,
    }
  }

  return null
}

function buildListData(oldData, shape, items, pagination) {
  if (shape === 'nested') {
    return {
      ...oldData,
      data: {
        ...oldData.data,
        items,
        pagination: pagination ?? oldData.data.pagination,
      },
    }
  }

  return {
    ...oldData,
    data: items,
    pagination: pagination ?? oldData.pagination,
  }
}

export function updatePaginatedQueryData(oldData, updater) {
  if (!oldData) return oldData

  const parsed = getListItems(oldData)
  if (!parsed) return oldData

  const nextItems = updater(parsed.items, parsed.pagination)

  if (!Array.isArray(nextItems)) {
    return oldData
  }

  return buildListData(oldData, parsed.shape, nextItems, parsed.pagination)
}

export function updateSingleQueryData(oldData, item) {
  if (!item) return oldData

  if (!oldData) {
    return { data: cloneShallow(item) }
  }

  if (oldData.data && typeof oldData.data === 'object' && !Array.isArray(oldData.data)) {
    return {
      ...oldData,
      data: {
        ...oldData.data,
        ...cloneShallow(item),
      },
    }
  }

  return {
    ...oldData,
    data: cloneShallow(item),
  }
}

export function markQueriesStaleWithoutRefetch(queryClient, queryKey) {
  if (!queryClient || !queryKey) return

  queryClient.invalidateQueries({
    queryKey,
    refetchType: 'none',
  })
}

export function getPaginatedItems(data) {
  const parsed = getListItems(data)
  return parsed ? parsed.items : []
}
