import React from 'react'
import { View, StyleSheet } from 'react-native'
import Button from '../common/Button'
import { spacing } from '@/theme'

export default function FormActions({
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  submitVariant = 'primary',
  cancelVariant = 'outline',
  children,
  style,
  stacked = false,
  testID,
}) {
  return (
    <View
      style={[styles.row, stacked && styles.stacked, style]}
      testID={testID}
    >
      {children || (
        <>
          {onCancel ? (
            <Button
              title={cancelLabel}
              variant={cancelVariant}
              onPress={onCancel}
              disabled={loading || disabled}
              style={styles.btn}
            />
          ) : null}
          {onSubmit ? (
            <Button
              title={submitLabel}
              variant={submitVariant}
              onPress={onSubmit}
              loading={loading}
              disabled={disabled}
              style={styles.btn}
            />
          ) : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  stacked: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },
  btn: {
    minWidth: 120,
    flexGrow: 1,
  },
})
