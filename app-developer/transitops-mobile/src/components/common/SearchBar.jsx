import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, TextInput, Pressable, StyleSheet } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { colors, spacing, typography, radius, layout } from '@/theme'

const DEFAULT_DEBOUNCE_MS = 300

export default function SearchBar({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onDebouncedChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  placeholder = 'Search…',
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}) {
  const isControlled = controlledValue !== undefined
  const [internal, setInternal] = useState(defaultValue)
  const value = isControlled ? controlledValue : internal
  const timerRef = useRef(null)

  const emitDebounced = useCallback(
    (next) => {
      if (!onDebouncedChange && !onChange) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (onDebouncedChange) onDebouncedChange(next)
        else if (onChange) onChange(next)
      }, debounceMs)
    },
    [onDebouncedChange, onChange, debounceMs],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleChange = (next) => {
    if (!isControlled) setInternal(next)
    if (onDebouncedChange) {
      // Immediate sync optional via onChange; debounce the search callback
      if (onChange && onChange !== onDebouncedChange) onChange(next)
      emitDebounced(next)
    } else if (onChange) {
      emitDebounced(next)
    }
  }

  const clear = () => {
    if (!isControlled) setInternal('')
    if (timerRef.current) clearTimeout(timerRef.current)
    if (onChange) onChange('')
    if (onDebouncedChange) onDebouncedChange('')
  }

  return (
    <View
      style={[styles.container, disabled && styles.disabled, style]}
      testID={testID}
    >
      <Search size={18} color={colors.muted} strokeWidth={2} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        editable={!disabled}
        style={styles.input}
        allowFontScaling
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel={accessibilityLabel || placeholder}
        accessibilityHint={accessibilityHint || 'Type to search'}
        accessibilityRole="search"
        {...rest}
      />
      {value ? (
        <Pressable
          onPress={clear}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          disabled={disabled}
        >
          <X size={16} color={colors.muted} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Math.max(layout.inputHeight, 44),
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.55,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  clearBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
})
