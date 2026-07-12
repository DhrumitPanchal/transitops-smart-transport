import React from 'react'
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native'
import { colors, spacing, typography, radius, layout } from '@/theme'

const VARIANT_STYLES = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryDark },
    text: { color: colors.white },
    spinner: colors.white,
  },
  secondary: {
    container: { backgroundColor: colors.primaryMuted },
    pressed: { backgroundColor: '#99f6e4' },
    text: { color: colors.primaryDark },
    spinner: colors.primary,
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    pressed: { backgroundColor: colors.primaryMuted },
    text: { color: colors.primary },
    spinner: colors.primary,
  },
  danger: {
    container: { backgroundColor: colors.danger },
    pressed: { backgroundColor: '#b91c1c' },
    text: { color: colors.white },
    spinner: colors.white,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    pressed: { backgroundColor: colors.grayMuted },
    text: { color: colors.primary },
    spinner: colors.primary,
  },
}

const SIZE_STYLES = {
  sm: {
    container: { minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    text: { fontSize: 14 },
  },
  md: {
    container: { minHeight: layout.buttonHeight, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    text: { fontSize: 16 },
  },
  lg: {
    container: { minHeight: 56, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    text: { fontSize: 18 },
  },
}

export default function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md
  const isDisabled = disabled || loading
  const label = accessibilityLabel || (typeof title === 'string' ? title : 'Button')

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantStyle.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.spinner} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          {title || children ? (
            <Text
              style={[
                styles.text,
                variantStyle.text,
                sizeStyle.text,
                textStyle,
              ]}
              allowFontScaling
              numberOfLines={1}
            >
              {title || children}
            </Text>
          ) : null}
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
})
