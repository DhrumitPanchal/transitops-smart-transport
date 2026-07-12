import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/validations/authValidation'
import { useAuth } from '@/hooks/auth/useAuth'
import { getErrorMessage, getFieldErrors } from '@/api/apiError'
import { toast } from '@/components/feedback/Toast'
import { APP_NAME } from '@/config/env'
import { ROUTES } from '@/constants/routes'
import AppScreen from '@/components/layout/AppScreen'
import TextField from '@/components/forms/TextField'
import PasswordField from '@/components/forms/PasswordField'
import Button from '@/components/common/Button'
import InlineAlert from '@/components/feedback/InlineAlert'
import { colors, spacing, typography } from '@/theme'

export default function RegisterScreen() {
  const router = useRouter()
  const { register: registerAccount, isLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const busy = isLoading || submitting

  const onSubmit = async (values) => {
    if (busy) return
    clearErrors()
    setSubmitting(true)

    try {
      const result = await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      toast.success(
        result?.message ||
          'Registration successful. Your account is waiting for administrator approval.',
      )
      router.replace(ROUTES.DASHBOARD)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field, {
            type: 'server',
            message: Array.isArray(message) ? message[0] : String(message),
          })
        })
      }

      setError('root', {
        message:
          getErrorMessage(error) ||
          'Unable to register. Please check your details and try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppScreen scroll keyboardAvoiding>
      <View style={styles.brandBlock}>
        <Text style={styles.brandEyebrow} allowFontScaling>
          {APP_NAME}
        </Text>
        <Text style={styles.title} allowFontScaling>
          Create an account
        </Text>
        <Text style={styles.subtitle} allowFontScaling>
          Register with your work email. A Super Admin must approve your account
          and assign a role before operational access is granted.
        </Text>
      </View>

      {errors.root?.message ? (
        <InlineAlert
          variant="error"
          title="Registration failed"
          message={errors.root.message}
          style={styles.alert}
        />
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Full name"
            required
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Your name"
            autoCapitalize="words"
            autoComplete="name"
            disabled={busy}
            error={errors.name?.message}
            accessibilityLabel="Full name"
            returnKeyType="next"
          />
        )}
      />

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
            textContentType="emailAddress"
            disabled={busy}
            error={errors.email?.message}
            accessibilityLabel="Email"
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
            placeholder="Create a password"
            disabled={busy}
            error={errors.password?.message}
            accessibilityLabel="Password"
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordField
            label="Confirm password"
            required
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Confirm password"
            disabled={busy}
            error={errors.confirmPassword?.message}
            accessibilityLabel="Confirm password"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <Button
        title="Create account"
        onPress={handleSubmit(onSubmit)}
        loading={busy}
        disabled={busy}
        fullWidth
        accessibilityLabel="Create account"
        accessibilityHint="Submit registration and sign in"
        style={styles.submit}
      />

      <View style={styles.footerRow}>
        <Text style={styles.footerText} allowFontScaling>
          Already registered?
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            disabled={busy}
          >
            <Text style={styles.footerLink} allowFontScaling>
              Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
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
})
