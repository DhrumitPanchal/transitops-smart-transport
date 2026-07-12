import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, statusColors, spacing, typography, radius } from '@/theme'
import { STATUS_LABELS } from '@/constants/statuses'

function resolveStatus(status) {
  if (!status) return { bg: colors.grayMuted, text: colors.gray, label: '—' }
  const key = String(status).toUpperCase()
  const palette = statusColors[key] || { bg: colors.grayMuted, text: colors.gray }
  const label = STATUS_LABELS[key] || String(status).replace(/_/g, ' ')
  return { ...palette, label }
}

export default function StatusBadge({
  status,
  label: labelOverride,
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}) {
  const { bg, text, label } = resolveStatus(status)
  const display = labelOverride || label
  const isSm = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        { backgroundColor: bg },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `Status: ${display}`}
      testID={testID}
    >
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text
        style={[styles.text, isSm && styles.textSm, { color: text }]}
        allowFontScaling
        numberOfLines={1}
      >
        {display}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    gap: spacing.xs,
    minHeight: 28,
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    minHeight: 22,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
})
