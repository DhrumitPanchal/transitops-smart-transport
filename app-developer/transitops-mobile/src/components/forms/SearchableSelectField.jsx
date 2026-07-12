import React, { useMemo, useState, forwardRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native'
import { ChevronDown, Check, X, Search } from 'lucide-react-native'
import FieldWrapper from './FieldWrapper'
import IconButton from '../common/IconButton'
import { colors, spacing, typography, radius, layout } from '@/theme'

function normalizeOptions(options = []) {
  return options.map((opt) => {
    if (opt == null) return { label: '', value: '' }
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt }
    }
    return {
      label: opt.label ?? String(opt.value ?? ''),
      value: opt.value,
      disabled: opt.disabled,
    }
  })
}

const SearchableSelectField = forwardRef(function SearchableSelectField(
  {
    label,
    required = false,
    error,
    helper,
    disabled = false,
    readOnly = false,
    value,
    onChange,
    onValueChange,
    options = [],
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
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
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const items = normalizeOptions(options)
  const selected = items.find((o) => o.value === value)
  const hasError = Boolean(error)
  const editable = !disabled && !readOnly
  const emit = onChange || onValueChange

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, query])

  const openModal = () => {
    if (!editable) return
    setQuery('')
    setOpen(true)
  }

  const pick = (item) => {
    if (item.disabled) return
    emit?.(item.value)
    setOpen(false)
    onSubmitEditing?.()
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
      <Pressable
        ref={ref}
        onPress={openModal}
        disabled={!editable}
        style={({ pressed }) => [
          styles.trigger,
          hasError && styles.triggerError,
          readOnly && styles.readOnly,
          pressed && editable && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label || 'Searchable select'}
        accessibilityHint={accessibilityHint || 'Opens a searchable list of options'}
        accessibilityState={{ disabled: !editable, expanded: open }}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholder]}
          allowFontScaling
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} allowFontScaling>
                {label || 'Select'}
              </Text>
              <IconButton
                icon={X}
                onPress={() => setOpen(false)}
                accessibilityLabel="Close"
                size="sm"
              />
            </View>

            <View style={styles.searchRow}>
              <Search size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.placeholder}
                style={styles.searchInput}
                allowFontScaling
                autoFocus
                returnKeyType="search"
                accessibilityLabel="Filter options"
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.value === value
                return (
                  <Pressable
                    onPress={() => pick(item)}
                    disabled={item.disabled}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                      item.disabled && styles.optionDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: item.disabled }}
                    accessibilityLabel={item.label}
                  >
                    <Text
                      style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      allowFontScaling
                    >
                      {item.label}
                    </Text>
                    {isSelected ? <Check size={18} color={colors.primary} /> : null}
                  </Pressable>
                )
              }}
              ListEmptyComponent={
                <Text style={styles.empty} allowFontScaling>
                  No matches
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </FieldWrapper>
  )
})

export default SearchableSelectField

const styles = StyleSheet.create({
  trigger: {
    minHeight: Math.max(layout.inputHeight, 44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  readOnly: {
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.placeholder,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingBottom: spacing['2xl'],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  option: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: colors.primaryMuted,
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
  optionTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    padding: spacing['2xl'],
  },
})
