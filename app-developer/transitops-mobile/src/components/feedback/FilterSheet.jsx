import React, { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Check } from 'lucide-react-native'
import Button from '../common/Button'
import IconButton from '../common/IconButton'
import { colors, spacing, typography, radius } from '@/theme'

/**
 * filters: [{ id, label, options: [{ value, label }], multiple?: boolean }]
 * value: { [filterId]: string | string[] }
 */
export default function FilterSheet({
  visible = false,
  title = 'Filters',
  filters = [],
  value = {},
  onChange,
  onApply,
  onReset,
  onClose,
  applyLabel = 'Apply filters',
  resetLabel = 'Reset',
  style,
  testID,
}) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (visible) setDraft(value || {})
  }, [visible, value])

  const toggle = (filter, optionValue) => {
    setDraft((prev) => {
      const current = prev[filter.id]
      if (filter.multiple) {
        const list = Array.isArray(current) ? [...current] : []
        const idx = list.indexOf(optionValue)
        if (idx >= 0) list.splice(idx, 1)
        else list.push(optionValue)
        return { ...prev, [filter.id]: list }
      }
      return {
        ...prev,
        [filter.id]: current === optionValue ? undefined : optionValue,
      }
    })
  }

  const isSelected = (filter, optionValue) => {
    const current = draft[filter.id]
    if (filter.multiple) {
      return Array.isArray(current) && current.includes(optionValue)
    }
    return current === optionValue
  }

  const handleApply = () => {
    onChange?.(draft)
    onApply?.(draft)
    onClose?.()
  }

  const handleReset = () => {
    const empty = {}
    setDraft(empty)
    onReset?.(empty)
    onChange?.(empty)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            style,
          ]}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          testID={testID}
        >
          <View style={styles.header}>
            <Text style={styles.title} allowFontScaling>
              {title}
            </Text>
            <IconButton
              icon={X}
              onPress={onClose}
              accessibilityLabel="Close filters"
              size="sm"
            />
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {filters.map((filter) => (
              <View key={filter.id} style={styles.group}>
                <Text style={styles.groupLabel} allowFontScaling>
                  {filter.label}
                </Text>
                <View style={styles.chips}>
                  {(filter.options || []).map((option) => {
                    const selected = isSelected(filter, option.value)
                    return (
                      <Pressable
                        key={`${filter.id}-${option.value}`}
                        onPress={() => toggle(filter, option.value)}
                        style={[styles.chip, selected && styles.chipSelected]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                      >
                        {selected ? (
                          <Check size={14} color={colors.primaryDark} strokeWidth={2.5} />
                        ) : null}
                        <Text
                          style={[styles.chipText, selected && styles.chipTextSelected]}
                          allowFontScaling
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={resetLabel}
              variant="ghost"
              onPress={handleReset}
              style={styles.footerBtn}
            />
            <Button
              title={applyLabel}
              variant="primary"
              onPress={handleApply}
              style={styles.footerBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  body: {
    maxHeight: 420,
  },
  bodyContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    flex: 1,
  },
})
