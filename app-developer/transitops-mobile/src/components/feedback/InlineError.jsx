import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { colors, spacing, typography, radius } from '@/theme'

export default function InlineError({
  message,
  children,
  style,
  accessibilityLabel,
  testID,
}) {
  const text = message || children
  if (!text) return null

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel || String(text)}
      testID={testID}
    >
      <AlertCircle size={16} color={colors.danger} strokeWidth={2} />
      <Text style={styles.text} allowFontScaling>
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
})
