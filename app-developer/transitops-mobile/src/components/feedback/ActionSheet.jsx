import React from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, typography, radius } from '@/theme'

/**
 * @typedef {{ id?: string, label: string, onPress: () => void, destructive?: boolean, disabled?: boolean, icon?: any }} ActionSheetItem
 */

export default function ActionSheet({
  visible = false,
  title,
  message,
  options = [],
  onClose,
  cancelLabel = 'Cancel',
  style,
  testID,
}) {
  const insets = useSafeAreaInsets()

  const handleSelect = (option) => {
    if (option.disabled) return
    onClose?.()
    // Defer so modal closes first
    setTimeout(() => option.onPress?.(), 50)
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
          {(title || message) ? (
            <View style={styles.header}>
              {title ? (
                <Text style={styles.title} allowFontScaling>
                  {title}
                </Text>
              ) : null}
              {message ? (
                <Text style={styles.message} allowFontScaling>
                  {message}
                </Text>
              ) : null}
            </View>
          ) : null}

          {options.map((option, index) => {
            const Icon = option.icon
            return (
              <Pressable
                key={option.id || `${option.label}-${index}`}
                onPress={() => handleSelect(option)}
                disabled={option.disabled}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                  option.disabled && styles.optionDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ disabled: option.disabled }}
              >
                {Icon ? (
                  <Icon
                    size={18}
                    color={option.destructive ? colors.danger : colors.textSecondary}
                    strokeWidth={2}
                  />
                ) : null}
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.destructive,
                  ]}
                  allowFontScaling
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              pressed && styles.optionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={styles.cancelText} allowFontScaling>
              {cancelLabel}
            </Text>
          </Pressable>
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
    paddingTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  option: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  destructive: {
    color: colors.danger,
    fontWeight: '600',
  },
  cancel: {
    minHeight: 52,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.button,
    color: colors.muted,
  },
})
