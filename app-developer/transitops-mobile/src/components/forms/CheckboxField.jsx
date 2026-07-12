import React, { forwardRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Check } from 'lucide-react-native'
import FieldWrapper from './FieldWrapper'
import { colors, spacing, typography, radius } from '@/theme'

const CheckboxField = forwardRef(function CheckboxField(
  {
    label,
    required = false,
    error,
    helper,
    disabled = false,
    readOnly = false,
    value = false,
    checked,
    onChange,
    onValueChange,
    keyboardType: _keyboardType,
    returnKeyType: _returnKeyType,
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    style,
    testID,
  },
  ref,
) {
  const isChecked = checked !== undefined ? Boolean(checked) : Boolean(value)
  const editable = !disabled && !readOnly
  const emit = onChange || onValueChange

  const toggle = () => {
    if (!editable) return
    emit?.(!isChecked)
    onSubmitEditing?.()
  }

  return (
    <FieldWrapper
      label={null}
      required={false}
      error={error}
      helper={helper}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={style}
    >
      <Pressable
        ref={ref}
        onPress={toggle}
        disabled={!editable}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ checked: isChecked, disabled: !editable }}
      >
        <View
          style={[
            styles.box,
            isChecked && styles.boxChecked,
            error && styles.boxError,
            !editable && styles.boxDisabled,
          ]}
        >
          {isChecked ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}
        </View>
        {label ? (
          <Text style={styles.label} allowFontScaling>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        ) : null}
      </Pressable>
    </FieldWrapper>
  )
})

export default CheckboxField

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: spacing.md,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  boxDisabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  required: {
    color: colors.danger,
    fontWeight: '600',
  },
})
