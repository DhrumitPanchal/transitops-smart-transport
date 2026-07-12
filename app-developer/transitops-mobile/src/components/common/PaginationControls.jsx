import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { colors, spacing, typography, radius } from '@/theme'

export default function PaginationControls({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  disabled = false,
  style,
  accessibilityLabel,
  testID,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const current = Math.min(Math.max(1, page), totalPages)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  const canPrev = current > 1 && !disabled
  const canNext = current < totalPages && !disabled

  return (
    <View
      style={[styles.row, style]}
      accessibilityLabel={accessibilityLabel || 'Pagination'}
      testID={testID}
    >
      <Text style={styles.meta} allowFontScaling>
        {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
      </Text>

      <View style={styles.controls}>
        <Pressable
          onPress={() => canPrev && onPageChange?.(current - 1)}
          disabled={!canPrev}
          style={({ pressed }) => [
            styles.btn,
            pressed && canPrev && styles.btnPressed,
            !canPrev && styles.btnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: !canPrev }}
        >
          <ChevronLeft size={20} color={canPrev ? colors.text : colors.placeholder} />
        </Pressable>

        <Text style={styles.pageLabel} allowFontScaling>
          {current} / {totalPages}
        </Text>

        <Pressable
          onPress={() => canNext && onPageChange?.(current + 1)}
          disabled={!canNext}
          style={({ pressed }) => [
            styles.btn,
            pressed && canNext && styles.btnPressed,
            !canNext && styles.btnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: !canNext }}
        >
          <ChevronRight size={20} color={canNext ? colors.text : colors.placeholder} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.muted,
    flexShrink: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    backgroundColor: colors.primaryMuted,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  pageLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'center',
  },
})
