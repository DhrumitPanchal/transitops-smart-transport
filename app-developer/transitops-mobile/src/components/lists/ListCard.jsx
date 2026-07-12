import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import Card from '../common/Card'
import { colors, spacing, typography } from '@/theme'

export default function ListCard({
  title,
  subtitle,
  meta,
  left,
  right,
  onPress,
  showChevron = true,
  footer,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) {
  return (
    <Card
      onPress={onPress}
      style={[styles.card, style]}
      padded
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      <View style={styles.row}>
        {left ? <View style={styles.left}>{left}</View> : null}
        <View style={styles.body}>
          {title ? (
            <Text style={styles.title} allowFontScaling numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} allowFontScaling numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={styles.meta} allowFontScaling numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
        {onPress && showChevron && !right ? (
          <ChevronRight size={18} color={colors.placeholder} />
        ) : null}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  right: {
    alignItems: 'flex-end',
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
