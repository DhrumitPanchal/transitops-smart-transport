import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Info, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react-native'
import { colors, spacing, typography, radius } from '@/theme'

const VARIANTS = {
  info: {
    bg: colors.infoBg,
    border: '#bae6fd',
    text: colors.info,
    Icon: Info,
  },
  success: {
    bg: colors.successBg,
    border: '#a7f3d0',
    text: colors.success,
    Icon: CheckCircle2,
  },
  warning: {
    bg: colors.warningBg,
    border: '#fde68a',
    text: colors.warning,
    Icon: AlertTriangle,
  },
  error: {
    bg: colors.dangerBg,
    border: '#fecaca',
    text: colors.danger,
    Icon: XCircle,
  },
  danger: {
    bg: colors.dangerBg,
    border: '#fecaca',
    text: colors.danger,
    Icon: XCircle,
  },
}

export default function InlineAlert({
  variant = 'info',
  title,
  message,
  children,
  onDismiss,
  style,
  accessibilityLabel,
  testID,
}) {
  const config = VARIANTS[variant] || VARIANTS.info
  const { Icon, bg, border, text } = config
  const body = message || children

  return (
    <View
      style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel || title || String(body || 'Alert')}
      testID={testID}
    >
      <Icon size={18} color={text} strokeWidth={2} style={styles.icon} />
      <View style={styles.content}>
        {title ? (
          <Text style={[styles.title, { color: text }]} allowFontScaling>
            {title}
          </Text>
        ) : null}
        {body ? (
          <Text style={[styles.message, { color: text }]} allowFontScaling>
            {body}
          </Text>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
          hitSlop={8}
        >
          <X size={16} color={text} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.label,
    fontWeight: '700',
  },
  message: {
    ...typography.bodySmall,
  },
  dismiss: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
