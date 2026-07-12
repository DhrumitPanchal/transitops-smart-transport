import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ShieldAlert } from 'lucide-react-native'
import AppScreen from '@/components/layout/AppScreen'
import Button from '@/components/common/Button'
import { ROUTES } from '@/constants/routes'
import { colors, spacing, typography, radius } from '@/theme'

export default function UnauthorizedScreen() {
  const router = useRouter()

  return (
    <AppScreen>
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel="Access denied"
      >
        <View style={styles.iconWrap}>
          <ShieldAlert size={36} color={colors.danger} strokeWidth={2} />
        </View>
        <Text style={styles.title} allowFontScaling>
          Access denied
        </Text>
        <Text style={styles.message} allowFontScaling>
          You do not have permission to view this screen. Go back or return to
          the dashboard.
        </Text>
        <View style={styles.actions}>
          <Button
            title="Go back"
            variant="outline"
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
            style={styles.btn}
          />
          <Button
            title="Dashboard"
            onPress={() => router.replace(ROUTES.DASHBOARD)}
            accessibilityLabel="Go to dashboard"
            accessibilityHint="Opens the home dashboard"
            style={styles.btn}
          />
        </View>
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: 360,
  },
  btn: {
    flex: 1,
  },
})
