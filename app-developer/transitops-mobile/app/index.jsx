import { Redirect } from 'expo-router'
import { useAuth } from '@/hooks/auth/useAuth'
import ScreenLoader from '@/components/feedback/ScreenLoader'
import { ROUTES } from '@/constants/routes'

export default function Index() {
  const { isBootstrapping, isAuthenticated, landingRoute } = useAuth()

  if (isBootstrapping) {
    return (
      <ScreenLoader
        message="Starting TransitOps…"
        accessibilityLabel="Loading TransitOps"
      />
    )
  }

  if (isAuthenticated) {
    return <Redirect href={landingRoute || ROUTES.DASHBOARD || '/(app)/dashboard'} />
  }

  return <Redirect href="/(auth)/login" />
}
