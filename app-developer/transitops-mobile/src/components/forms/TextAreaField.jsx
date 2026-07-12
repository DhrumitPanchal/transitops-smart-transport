import React, { forwardRef } from 'react'
import { TextInput, StyleSheet } from 'react-native'
import FieldWrapper from './FieldWrapper'
import { colors, spacing, typography, radius } from '@/theme'

const TextAreaField = forwardRef(function TextAreaField(
  {
    label,
    required = false,
    error,
    helper,
    disabled = false,
    readOnly = false,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    returnKeyType = 'default',
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    numberOfLines = 4,
    minHeight = 112,
    style,
    inputStyle,
    testID,
    ...rest
  },
  ref,
) {
  const hasError = Boolean(error)
  const editable = !disabled && !readOnly

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      helper={helper}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={style}
    >
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        editable={editable}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        allowFontScaling
        style={[
          styles.input,
          { minHeight },
          hasError && styles.inputError,
          readOnly && styles.readOnly,
          inputStyle,
        ]}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !editable }}
        {...rest}
      />
    </FieldWrapper>
  )
})

export default TextAreaField

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    ...typography.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  readOnly: {
    backgroundColor: colors.surface,
  },
})
