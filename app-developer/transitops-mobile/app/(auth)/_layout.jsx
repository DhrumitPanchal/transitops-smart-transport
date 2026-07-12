import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/hooks/auth/useAuth'
import ScreenLoader from '@/components/feedback/ScreenLoader'
import { colors } from '@/theme'
import { ROUTES } from '@/constants/routes'

export default function AuthLayout() {
  const { isBootstrapping, isAuthenticated, landingRoute } = useAuth()

  if (isBootstrapping) {
    return (
      <ScreenLoader
        message="Checking session…"
        accessibilityLabel="Checking authentication"
      />
    )
  }

  if (isAuthenticated) {
    return <Redirect href={landingRoute || ROUTES.DASHBOARD} />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
