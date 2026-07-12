import React, { useMemo, useState, forwardRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Calendar, X } from 'lucide-react-native'
import FieldWrapper from './FieldWrapper'
import Button from '../common/Button'
import IconButton from '../common/IconButton'
import { colors, spacing, typography, radius, layout } from '@/theme'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDateString(value) {
  if (!DATE_RE.test(value || '')) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(value) {
  if (!isValidDateString(value)) return new Date()
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const DateField = forwardRef(function DateField(
  {
    label,
    required = false,
    error,
    helper,
    disabled = false,
    readOnly = false,
    value = '',
    onChangeText,
    onChange,
    placeholder = 'yyyy-MM-dd',
    keyboardType = 'numbers-and-punctuation',
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
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => parseDate(value))
  const hasError = Boolean(error)
  const editable = !disabled && !readOnly

  const emit = (next) => {
    onChangeText?.(next)
    onChange?.(next)
  }

  const openPicker = () => {
    if (!editable) return
    setViewDate(parseDate(value))
    setOpen(true)
  }

  const days = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startPad; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
    return cells
  }, [viewDate])

  const monthLabel = viewDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      helper={helper || 'Format: yyyy-MM-dd'}
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
          onChangeText={(text) => emit(text)}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={editable}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling
          style={[styles.input, inputStyle]}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || 'Enter date as yyyy-MM-dd'}
          accessibilityState={{ disabled: !editable }}
          {...rest}
        />
        <IconButton
          icon={Calendar}
          onPress={openPicker}
          disabled={!editable}
          accessibilityLabel="Open date picker"
          size="sm"
          variant="ghost"
        />
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} allowFontScaling>
                Select date
              </Text>
              <IconButton
                icon={X}
                onPress={() => setOpen(false)}
                accessibilityLabel="Close date picker"
                size="sm"
              />
            </View>

            <View style={styles.monthNav}>
              <Button
                title="‹"
                variant="ghost"
                size="sm"
                onPress={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                }
                accessibilityLabel="Previous month"
              />
              <Text style={styles.monthLabel} allowFontScaling>
                {monthLabel}
              </Text>
              <Button
                title="›"
                variant="ghost"
                size="sm"
                onPress={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                }
                accessibilityLabel="Next month"
              />
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekday} allowFontScaling>
                  {d}
                </Text>
              ))}
            </View>

            <ScrollView>
              <View style={styles.grid}>
                {days.map((day, idx) => {
                  if (day == null) {
                    return <View key={`e-${idx}`} style={styles.dayCell} />
                  }
                  const dateStr = `${viewDate.getFullYear()}-${pad(viewDate.getMonth() + 1)}-${pad(day)}`
                  const selected = value === dateStr
                  return (
                    <Pressable
                      key={dateStr}
                      onPress={() => {
                        emit(dateStr)
                        setOpen(false)
                      }}
                      style={[styles.dayCell, selected && styles.daySelected]}
                      accessibilityRole="button"
                      accessibilityLabel={dateStr}
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[styles.dayText, selected && styles.dayTextSelected]}
                        allowFontScaling
                      >
                        {day}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>

            <Button
              title="Today"
              variant="outline"
              size="sm"
              onPress={() => {
                const today = toDateString(new Date())
                emit(today)
                setOpen(false)
              }}
              style={styles.todayBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </FieldWrapper>
  )
})

export default DateField

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
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  dayText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  todayBtn: {
    marginTop: spacing.md,
  },
})
