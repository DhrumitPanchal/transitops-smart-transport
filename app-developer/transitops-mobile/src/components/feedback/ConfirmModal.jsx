import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import Button from '../common/Button'
import { colors, spacing, typography, radius, shadows } from '@/theme'

export default function ConfirmModal({
  visible = false,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  loading = false,
  destructive = false,
  style,
  testID,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.dialog, style]}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alertdialog"
          accessibilityViewIsModal
          testID={testID}
        >
          <Text style={styles.title} allowFontScaling>
            {title}
          </Text>
          {message ? (
            <Text style={styles.message} allowFontScaling>
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="outline"
              onPress={onCancel}
              disabled={loading}
              style={styles.btn}
            />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : confirmVariant}
              onPress={onConfirm}
              loading={loading}
              style={styles.btn}
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
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
  },
})
