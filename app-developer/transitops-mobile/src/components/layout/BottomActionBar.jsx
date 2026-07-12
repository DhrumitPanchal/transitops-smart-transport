import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, shadows } from '@/theme'

export default function BottomActionBar({
  children,
  style,
  elevated = true,
  testID,
}) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.bar,
        elevated && shadows.lg,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
})
