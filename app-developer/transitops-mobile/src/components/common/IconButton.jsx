import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors, radius } from '@/theme'

const SIZES = {
  sm: 40,
  md: 44,
  lg: 52,
}

const VARIANTS = {
  default: {
    bg: colors.transparent,
    pressed: colors.grayMuted,
    icon: colors.textSecondary,
  },
  primary: {
    bg: colors.primaryMuted,
    pressed: '#99f6e4',
    icon: colors.primary,
  },
  danger: {
    bg: colors.dangerBg,
    pressed: '#fecaca',
    icon: colors.danger,
  },
  ghost: {
    bg: colors.transparent,
    pressed: colors.grayMuted,
    icon: colors.muted,
  },
}

export default function IconButton({
  icon: Icon,
  onPress,
  size = 'md',
  variant = 'default',
  color,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md
  const palette = VARIANTS[variant] || VARIANTS.default
  const iconColor = color || palette.icon
  const iconSize = Math.round(dim * 0.45)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: Math.max(dim, 44),
          height: Math.max(dim, 44),
          backgroundColor: pressed && !disabled ? palette.pressed : palette.bg,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || 'Icon button'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      hitSlop={4}
      {...rest}
    >
      <View pointerEvents="none">
        {typeof Icon === 'function' ? (
          <Icon size={iconSize} color={iconColor} strokeWidth={2} />
        ) : (
          Icon
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
})
