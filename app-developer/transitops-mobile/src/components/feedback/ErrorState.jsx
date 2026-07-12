import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import Button from '../common/Button'
import { colors, spacing, typography } from '@/theme'

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      <View style={styles.iconWrap}>
        <AlertTriangle size={32} color={colors.danger} strokeWidth={2} />
      </View>
      <Text style={styles.title} allowFontScaling>
        {title}
      </Text>
      {message ? (
        <Text style={styles.message} allowFontScaling>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
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
    backgroundColor: colors.dangerBg,
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
