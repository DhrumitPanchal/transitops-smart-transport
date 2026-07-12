import DropdownMenu from '../common/DropdownMenu'
import { DELETABLE_RESOURCES, LIFECYCLE_ACTIONS } from '../../constants/navigation'

export default function TableActions({
  resource,
  items = [],
  trigger,
}) {
  const filteredItems = items.filter((item) => {
    if (item.action !== LIFECYCLE_ACTIONS.DELETE) return true
    return DELETABLE_RESOURCES.includes(resource)
  })

  if (filteredItems.length === 0) return null

  return <DropdownMenu trigger={trigger} items={filteredItems} />
}
