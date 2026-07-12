import { View, Text, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { MapPinned } from 'lucide-react-native'
import AppScreen from '@/components/layout/AppScreen'
import Button from '@/components/common/Button'
import { colors, spacing, typography, radius } from '@/theme'
import { ROUTES } from '@/constants/routes'

export default function NotFoundScreen() {
  const router = useRouter()

  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <AppScreen>
        <View
          style={styles.container}
          accessibilityRole="text"
          accessibilityLabel="Page not found"
        >
          <View style={styles.iconWrap}>
            <MapPinned size={36} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.title} allowFontScaling>
            Page not found
          </Text>
          <Text style={styles.message} allowFontScaling>
            That screen does not exist or is not available in this build. Head
            back to the dashboard to continue.
          </Text>
          <Button
            title="Go to dashboard"
            onPress={() => router.replace(ROUTES.DASHBOARD)}
            accessibilityLabel="Go to dashboard"
            accessibilityHint="Returns to the home dashboard"
            fullWidth
          />
        </View>
      </AppScreen>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 340,
  },
})
