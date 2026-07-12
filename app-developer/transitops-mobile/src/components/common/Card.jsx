import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { colors, radius, shadows, layout } from '@/theme'

export default function Card({
  children,
  onPress,
  style,
  contentStyle,
  elevated = true,
  padded = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}) {
  const containerStyle = [
    styles.card,
    elevated && shadows.sm,
    padded && styles.padded,
    style,
  ]

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        {...rest}
      >
        <View style={contentStyle}>{children}</View>
      </Pressable>
    )
  }

  return (
    <View
      style={containerStyle}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      {...rest}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: layout.cardPadding,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
})
