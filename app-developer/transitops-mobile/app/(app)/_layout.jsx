import { useCallback, useMemo, useState } from 'react'
import { Redirect, usePathname, useRouter } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useAuth } from '@/hooks/auth/useAuth'
import { useRealtime } from '@/context/RealtimeContext'
import { useResponsive } from '@/hooks/useResponsive'
import { useToast } from '@/components/feedback/Toast'
import AppDrawer from '@/components/layout/AppDrawer'
import ScreenLoader from '@/components/feedback/ScreenLoader'
import ConfirmModal from '@/components/feedback/ConfirmModal'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { USER_STATUS } from '@/constants/statuses'
import { USE_MOCKS } from '@/config/env'
import { resetMockDemoData } from '@/services/authService'
import { getErrorMessage } from '@/api/apiError'
import { colors } from '@/theme'

function filterDrawerItems({ user, isPending, hasPermission }) {
  if (isPending || user?.status === USER_STATUS.PENDING) {
    return NAVIGATION_ITEMS.filter(
      (item) => item.id === 'dashboard' || item.id === 'profile',
    )
  }

  return NAVIGATION_ITEMS.filter((item) => {
    if (Array.isArray(item.roles) && item.roles.length > 0) {
      if (!item.roles.includes(user?.role)) return false
    }
    if (item.permission && !hasPermission(item.permission)) return false
    return true
  })
}

function AppDrawerContent(props) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToast()
  const { user, logout, isPending, hasPermission, forceLogout } = useAuth()
  const { connectionStatus } = useRealtime()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [resetting, setResetting] = useState(false)

  const items = useMemo(
    () => filterDrawerItems({ user, isPending, hasPermission }),
    [user, isPending, hasPermission],
  )

  const activeRoute = useMemo(() => {
    const match = items.find(
      (item) =>
        item.to &&
        (pathname === item.to ||
          (item.to !== '/' && pathname?.startsWith(`${item.to}/`))),
    )
    return match?.to || pathname
  }, [items, pathname])

  const handleNavigate = useCallback(
    (item) => {
      props.navigation?.closeDrawer?.()
      if (item?.to) {
        router.push(item.to)
      }
    },
    [props.navigation, router],
  )

  const handleLogoutConfirm = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
      setLogoutOpen(false)
      router.replace('/(auth)/login')
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to log out')
    } finally {
      setLoggingOut(false)
    }
  }, [logout, router, toast])

  const handleResetDemoData = useCallback(async () => {
    if (resetting) return
    setResetting(true)
    try {
      await resetMockDemoData()
      await forceLogout()
      toast.success('Demo data reset. Please sign in again.')
      props.navigation?.closeDrawer?.()
      router.replace('/(auth)/login')
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to reset demo data')
    } finally {
      setResetting(false)
    }
  }, [forceLogout, props.navigation, resetting, router, toast])

  return (
    <>
      <AppDrawer
        items={items}
        user={user}
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        onLogout={() => setLogoutOpen(true)}
        onResetDemoData={
          typeof __DEV__ !== 'undefined' && __DEV__ && USE_MOCKS
            ? handleResetDemoData
            : undefined
        }
        connectionStatus={connectionStatus}
      />
      <ConfirmModal
        visible={logoutOpen}
        title="Sign out"
        message="Are you sure you want to sign out of TransitOps?"
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        destructive
        loading={loggingOut}
        onCancel={() => (loggingOut ? null : setLogoutOpen(false))}
        onConfirm={handleLogoutConfirm}
      />
    </>
  )
}

export default function AppLayout() {
  const { isBootstrapping, isAuthenticated, user } = useAuth()
  const { isTabletUp } = useResponsive()

  if (isBootstrapping) {
    return (
      <ScreenLoader
        message="Loading workspace…"
        accessibilityLabel="Loading authenticated workspace"
      />
    )
  }

  if (!isAuthenticated || user?.status === USER_STATUS.INACTIVE) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Drawer
      drawerContent={(drawerProps) => <AppDrawerContent {...drawerProps} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceElevated },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.text,
        },
        headerShadowVisible: false,
        drawerType: isTabletUp ? 'permanent' : 'front',
        drawerStyle: {
          width: isTabletUp ? 300 : 288,
          backgroundColor: colors.sidebar,
        },
        overlayColor: colors.overlay,
        swipeEnabled: !isTabletUp,
        // Custom AppDrawer owns navigation labels; hide default drawer items.
        drawerItemStyle: { display: 'none' },
      }}
    >
      <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
      <Drawer.Screen
        name="unauthorized"
        options={{ title: 'Access denied' }}
      />
    </Drawer>
  )
}
