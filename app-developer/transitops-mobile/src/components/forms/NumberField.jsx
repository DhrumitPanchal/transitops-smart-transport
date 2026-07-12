import React, { forwardRef } from 'react'
import TextField from './TextField'

const NumberField = forwardRef(function NumberField(
  {
    label,
    required,
    error,
    helper,
    disabled,
    readOnly,
    value,
    onChangeText,
    onChangeNumber,
    placeholder,
    keyboardType = 'decimal-pad',
    returnKeyType = 'next',
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    allowNegative = false,
    style,
    inputStyle,
    testID,
    ...rest
  },
  ref,
) {
  const handleChange = (text) => {
    const pattern = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g
    let cleaned = String(text || '').replace(pattern, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`
    }
    onChangeText?.(cleaned)
    if (onChangeNumber) {
      const num = cleaned === '' || cleaned === '-' || cleaned === '.' ? null : Number(cleaned)
      onChangeNumber(Number.isFinite(num) ? num : null)
    }
  }

  return (
    <TextField
      ref={ref}
      label={label}
      required={required}
      error={error}
      helper={helper}
      disabled={disabled}
      readOnly={readOnly}
      value={value == null ? '' : String(value)}
      onChangeText={handleChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      autoCapitalize="none"
      autoCorrect={false}
      style={style}
      inputStyle={inputStyle}
      testID={testID}
      {...rest}
    />
  )
})

export default NumberField
