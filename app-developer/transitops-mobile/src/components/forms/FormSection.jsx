import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography, radius } from '@/theme'

export default function FormSection({
  title,
  description,
  children,
  style,
  contentStyle,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.section, style]}
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      {title || description ? (
        <View style={styles.header}>
          {title ? (
            <Text style={styles.title} allowFontScaling accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text style={styles.description} allowFontScaling>
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing['2xl'],
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  description: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  content: {
    gap: 0,
  },
})
