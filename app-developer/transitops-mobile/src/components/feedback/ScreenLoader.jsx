import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import LoadingSpinner from './LoadingSpinner'
import { colors, spacing, typography } from '@/theme'

export default function ScreenLoader({
  message = 'Loading…',
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel || message}
      testID={testID}
    >
      <LoadingSpinner size="large" label={null} />
      {message ? (
        <Text style={styles.message} allowFontScaling>
          {message}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
    minHeight: 200,
  },
  message: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
})
