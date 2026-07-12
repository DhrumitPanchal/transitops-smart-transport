import { useMemo } from 'react'
import { NAVIGATION_ITEMS } from '../constants/navigation'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'
import { USER_STATUS } from '../constants/statuses'

const PENDING_NAV_IDS = new Set(['dashboard', 'profile'])

export function useNavigationItems() {
  const { hasPermission, user, isPendingApproval } = useAuth()

  return useMemo(() => {
    if (isPendingApproval) {
      return NAVIGATION_ITEMS.filter((item) => PENDING_NAV_IDS.has(item.id))
    }

    if (user?.status === USER_STATUS.ACTIVE && !user?.role) {
      return NAVIGATION_ITEMS.filter((item) => item.to === ROUTES.PROFILE)
    }

    return NAVIGATION_ITEMS.filter((item) => {
      if (item.roles?.length && !item.roles.includes(user?.role)) {
        return false
      }

      if (item.permission && !hasPermission(item.permission)) {
        return false
      }

      return true
    })
  }, [hasPermission, isPendingApproval, user?.role, user?.status])
}
