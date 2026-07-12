import React, { forwardRef } from 'react'
import { TextInput, StyleSheet } from 'react-native'
import FieldWrapper from './FieldWrapper'
import { colors, spacing, typography, radius, layout } from '@/theme'

const TextField = forwardRef(function TextField(
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
    returnKeyType = 'next',
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    autoCapitalize = 'sentences',
    autoCorrect = true,
    secureTextEntry = false,
    multiline = false,
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
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        allowFontScaling
        style={[
          styles.input,
          hasError && styles.inputError,
          readOnly && styles.readOnly,
          !editable && styles.notEditable,
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

export default TextField

export const inputBaseStyles = StyleSheet.create({
  input: {
    minHeight: Math.max(layout.inputHeight, 44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  notEditable: {
    color: colors.muted,
  },
})

const styles = inputBaseStyles
