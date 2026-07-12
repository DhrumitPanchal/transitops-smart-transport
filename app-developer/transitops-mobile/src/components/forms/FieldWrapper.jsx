import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@/theme'

/**
 * Shared label, required marker, error, helper, and a11y wiring for form fields.
 */
export default function FieldWrapper({
  label,
  required = false,
  error,
  helper,
  disabled = false,
  children,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) {
  const hasError = Boolean(error)
  const describedBy = hasError ? 'error' : helper ? 'helper' : undefined

  return (
    <View
      style={[styles.wrapper, disabled && styles.disabled, style]}
      testID={testID}
      accessible={false}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {label ? (
        <Text style={[styles.label, hasError && styles.labelError]} allowFontScaling>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        accessibilityState={{ disabled }}
        accessibilityDescribedBy={describedBy}
      >
        {children}
      </View>

      {hasError ? (
        <Text
          style={styles.error}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          allowFontScaling
        >
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helper} allowFontScaling>
          {helper}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.danger,
  },
  required: {
    color: colors.danger,
    fontWeight: '600',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  helper: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
})

export { styles as fieldWrapperStyles }
