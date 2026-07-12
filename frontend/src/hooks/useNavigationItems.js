import { useMemo } from 'react'
import { NAVIGATION_ITEMS } from '../constants/navigation'
import { useAuth } from '../hooks/useAuth'

export function useNavigationItems() {
  const { hasPermission, user } = useAuth()

  return useMemo(() => {
    return NAVIGATION_ITEMS.filter((item) => {
      if (item.roles?.length && !item.roles.includes(user?.role)) {
        return false
      }

      if (item.permission && !hasPermission(item.permission)) {
        return false
      }

      return true
    })
  }, [hasPermission, user?.role])
}
