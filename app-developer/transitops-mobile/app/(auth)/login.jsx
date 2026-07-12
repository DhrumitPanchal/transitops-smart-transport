import { useMemo, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/validations/authValidation'
import { useAuth } from '@/hooks/auth/useAuth'
import { getDemoAccounts } from '@/services/authService'
import { getRoleLandingRoute } from '@/utils/helpers'
import { getErrorMessage } from '@/api/apiError'
import env, { APP_NAME, USE_MOCKS } from '@/config/env'
import { ROUTES } from '@/constants/routes'
import { USER_STATUS } from '@/constants/statuses'
import AppScreen from '@/components/layout/AppScreen'
import TextField from '@/components/forms/TextField'
import PasswordField from '@/components/forms/PasswordField'
import Button from '@/components/common/Button'
import InlineAlert from '@/components/feedback/InlineAlert'
import { colors, spacing, typography, radius } from '@/theme'

export default function LoginScreen() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const demoAccounts = useMemo(
    () => (USE_MOCKS || env.useMocks ? getDemoAccounts() : []),
    [],
  )

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const busy = isLoading || submitting

  const onSubmit = async (values) => {
    if (busy) return
    clearErrors('root')
    setSubmitting(true)

    try {
      const result = await login(values)
      const nextUser = result?.user

      if (nextUser?.status === USER_STATUS.PENDING) {
        router.replace(ROUTES.DASHBOARD)
        return
      }
      if (nextUser?.status === USER_STATUS.ACTIVE && !nextUser?.role) {
        router.replace(ROUTES.PROFILE)
        return
      }
      router.replace(getRoleLandingRoute(nextUser?.role))
    } catch (error) {
      const inactive =
        error?.code === 'USER_INACTIVE' ||
        /inactive/i.test(String(error?.message || ''))

      setError('root', {
        message: inactive
          ? error?.message ||
            'Your account is inactive. Contact the administrator.'
          : getErrorMessage(error) || 'Invalid email or password.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoAccount = (account) => {
    if (busy) return
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
    clearErrors('root')
  }

  return (
    <AppScreen scroll keyboardAvoiding>
      <View style={styles.brandBlock}>
        <Text style={styles.brandEyebrow} allowFontScaling>
          {APP_NAME}
        </Text>
        <Text style={styles.title} allowFontScaling>
          Sign in
        </Text>
        <Text style={styles.subtitle} allowFontScaling>
          Enter your work email and password to access fleet operations.
        </Text>
      </View>

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Sign in failed"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            required
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            disabled={busy}
            error={errors.email?.message}
            accessibilityLabel="Email"
            accessibilityHint="Enter your work email address"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordField
            label="Password"
            required
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter password"
            disabled={busy}
            error={errors.password?.message}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <Button
        title="Sign in"
        onPress={handleSubmit(onSubmit)}
        loading={busy}
        disabled={busy}
        fullWidth
        accessibilityLabel="Sign in"
        accessibilityHint="Sign in to TransitOps"
        style={styles.submit}
      />

      <View style={styles.footerRow}>
        <Text style={styles.footerText} allowFontScaling>
          Need an account?
        </Text>
        <Link href="/(auth)/register" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Create an account"
            disabled={busy}
          >
            <Text style={styles.footerLink} allowFontScaling>
              Register
            </Text>
          </Pressable>
        </Link>
      </View>

      {demoAccounts.length > 0 ? (
        <View style={styles.demoBlock}>
          <Text style={styles.demoTitle} allowFontScaling>
            Demo accounts
          </Text>
          <Text style={styles.demoHint} allowFontScaling>
            Tap an account to fill credentials (mock mode).
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.demoRow}
          >
            {demoAccounts.map((account) => (
              <Pressable
                key={account.email}
                onPress={() => fillDemoAccount(account)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.demoChip,
                  pressed && styles.demoChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Use demo account ${account.name || account.role || account.email}`}
              >
                <Text style={styles.demoChipText} allowFontScaling numberOfLines={1}>
                  {account.name || account.role || account.email}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  brandBlock: {
    marginBottom: spacing['2xl'],
  },
  brandEyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  alert: {
    marginBottom: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.muted,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  demoBlock: {
    marginTop: spacing['3xl'],
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  demoHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  demoRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  demoChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    justifyContent: 'center',
  },
  demoChipPressed: {
    backgroundColor: '#99f6e4',
  },
  demoChipText: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '600',
  },
})
