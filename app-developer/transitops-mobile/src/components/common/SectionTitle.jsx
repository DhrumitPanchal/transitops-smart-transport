import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@/theme'

export default function SectionTitle({
  title,
  subtitle,
  action,
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title} allowFontScaling>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} allowFontScaling>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  action: {
    marginTop: spacing.xxs,
  },
})
