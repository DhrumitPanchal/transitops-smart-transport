import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Wifi, WifiOff, Loader } from 'lucide-react-native'
import { colors, spacing, typography, radius } from '@/theme'

const STATUS_CONFIG = {
  connected: {
    label: 'Live',
    bg: colors.successBg,
    text: colors.success,
    Icon: Wifi,
  },
  disconnected: {
    label: 'Offline',
    bg: colors.grayMuted,
    text: colors.gray,
    Icon: WifiOff,
  },
  connecting: {
    label: 'Connecting',
    bg: colors.amberMuted,
    text: colors.amber,
    Icon: Loader,
  },
  error: {
    label: 'Error',
    bg: colors.dangerBg,
    text: colors.danger,
    Icon: WifiOff,
  },
}

export default function ConnectionStatusBadge({
  status = 'disconnected',
  label: labelOverride,
  showLabel = true,
  style,
  accessibilityLabel,
  testID,
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected
  const { Icon, bg, text, label } = config
  const display = labelOverride || label

  return (
    <View
      style={[styles.badge, { backgroundColor: bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={
        accessibilityLabel || `Connection status: ${display}`
      }
      testID={testID}
    >
      <Icon size={12} color={text} strokeWidth={2.5} />
      {showLabel ? (
        <Text style={[styles.text, { color: text }]} allowFontScaling>
          {display}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    minHeight: 28,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
})
