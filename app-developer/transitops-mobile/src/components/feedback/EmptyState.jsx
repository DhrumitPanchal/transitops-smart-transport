import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Inbox } from 'lucide-react-native'
import Button from '../common/Button'
import { colors, spacing, typography } from '@/theme'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  description,
  actionLabel,
  onAction,
  style,
  accessibilityLabel,
  testID,
}) {
  const body = message || description

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      <View style={styles.iconWrap}>
        <Icon size={36} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text style={styles.title} allowFontScaling>
        {title}
      </Text>
      {body ? (
        <Text style={styles.message} allowFontScaling>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.action}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 140,
  },
})
