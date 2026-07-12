import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'
import IconButton from '../common/IconButton'
import { colors, spacing, typography, layout } from '@/theme'

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.header, style]}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      <View style={styles.left}>
        {onBack ? (
          <IconButton
            icon={ChevronLeft}
            onPress={onBack}
            accessibilityLabel="Go back"
            size="md"
          />
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} allowFontScaling numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} allowFontScaling numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>{right || <View style={styles.spacer} />}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  right: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 44,
    height: 44,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 1,
  },
})
