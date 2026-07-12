import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@/theme'

export default function LoadingSpinner({
  size = 'small',
  color = colors.primary,
  label,
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel || label || 'Loading'}
      testID={testID}
    >
      <ActivityIndicator size={size} color={color} />
      {label ? (
        <Text style={styles.label} allowFontScaling>
          {label}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.muted,
  },
})
