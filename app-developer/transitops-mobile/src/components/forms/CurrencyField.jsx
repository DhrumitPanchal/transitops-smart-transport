import React, { forwardRef } from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import FieldWrapper from './FieldWrapper'
import { CURRENCY_SYMBOL } from '@/constants/appConstants'
import { colors, spacing, typography, radius, layout } from '@/theme'

const CurrencyField = forwardRef(function CurrencyField(
  {
    label,
    required = false,
    error,
    helper,
    disabled = false,
    readOnly = false,
    value,
    onChangeText,
    onChangeNumber,
    placeholder = '0.00',
    keyboardType = 'decimal-pad',
    returnKeyType = 'next',
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    currencySymbol = CURRENCY_SYMBOL,
    style,
    inputStyle,
    testID,
    ...rest
  },
  ref,
) {
  const hasError = Boolean(error)
  const editable = !disabled && !readOnly

  const handleChange = (text) => {
    let cleaned = String(text || '').replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`
    }
    if (parts[1]?.length > 2) {
      cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`
    }
    onChangeText?.(cleaned)
    if (onChangeNumber) {
      const num = cleaned === '' || cleaned === '.' ? null : Number(cleaned)
      onChangeNumber(Number.isFinite(num) ? num : null)
    }
  }

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
      <View
        style={[
          styles.row,
          hasError && styles.rowError,
          readOnly && styles.readOnly,
        ]}
      >
        <Text style={styles.symbol} allowFontScaling>
          {currencySymbol}
        </Text>
        <TextInput
          ref={ref}
          value={value == null ? '' : String(value)}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={editable}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          allowFontScaling
          style={[styles.input, inputStyle]}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: !editable }}
          {...rest}
        />
      </View>
    </FieldWrapper>
  )
})

export default CurrencyField

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Math.max(layout.inputHeight, 44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
  },
  rowError: {
    borderColor: colors.danger,
  },
  readOnly: {
    backgroundColor: colors.surface,
  },
  symbol: {
    ...typography.body,
    color: colors.muted,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
})
