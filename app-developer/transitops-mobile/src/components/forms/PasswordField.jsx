import React, { useState, forwardRef } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import FieldWrapper from './FieldWrapper'
import IconButton from '../common/IconButton'
import { colors, spacing, typography, radius, layout } from '@/theme'

const PasswordField = forwardRef(function PasswordField(
  {
    label = 'Password',
    required = false,
    error,
    helper,
    disabled = false,
    readOnly = false,
    value,
    onChangeText,
    placeholder = 'Enter password',
    keyboardType = 'default',
    returnKeyType = 'done',
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    style,
    inputStyle,
    testID,
    ...rest
  },
  ref,
) {
  const [visible, setVisible] = useState(false)
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
      <View style={[styles.row, hasError && styles.rowError, readOnly && styles.readOnly]}>
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
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          allowFontScaling
          style={[styles.input, inputStyle]}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: !editable }}
          {...rest}
        />
        <IconButton
          icon={visible ? EyeOff : Eye}
          onPress={() => setVisible((v) => !v)}
          disabled={disabled}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          size="sm"
          variant="ghost"
        />
      </View>
    </FieldWrapper>
  )
})

export default PasswordField

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Math.max(layout.inputHeight, 44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  rowError: {
    borderColor: colors.danger,
  },
  readOnly: {
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
})
