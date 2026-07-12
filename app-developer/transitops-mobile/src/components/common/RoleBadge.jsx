import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography, radius } from '@/theme'
import { ROLE_LABELS } from '@/constants/roles'

const ROLE_TONES = {
  SUPER_ADMIN: { bg: colors.primaryMuted, text: colors.primaryDark },
  FLEET_MANAGER: { bg: colors.blueMuted, text: colors.blue },
  DISPATCHER: { bg: colors.amberMuted, text: colors.amber },
  SAFETY_OFFICER: { bg: '#fce7f3', text: '#be185d' },
  FINANCIAL_ANALYST: { bg: colors.greenMuted, text: colors.green },
}

export default function RoleBadge({
  role,
  label: labelOverride,
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}) {
  const key = role ? String(role).toUpperCase() : ''
  const tone = ROLE_TONES[key] || { bg: colors.grayMuted, text: colors.gray }
  const display = labelOverride || ROLE_LABELS[key] || (key ? key.replace(/_/g, ' ') : '—')
  const isSm = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        { backgroundColor: tone.bg },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `Role: ${display}`}
      testID={testID}
    >
      <Text
        style={[styles.text, isSm && styles.textSm, { color: tone.text }]}
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
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    minHeight: 28,
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    minHeight: 22,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
})
