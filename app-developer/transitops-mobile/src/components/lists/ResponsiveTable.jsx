import React from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
} from 'react-native'
import EmptyState from '../feedback/EmptyState'
import { colors, spacing, typography, radius } from '@/theme'

const TABLET_BREAKPOINT = 768

/**
 * columns: [{ key, title, width?, flex?, render?(value, row), align? }]
 * data: array of row objects
 */
export default function ResponsiveTable({
  columns = [],
  data = [],
  keyExtractor,
  onRowPress,
  emptyTitle = 'No records',
  emptyMessage,
  style,
  testID,
}) {
  const { width } = useWindowDimensions()
  const isTablet = width >= TABLET_BREAKPOINT

  const getKey = (row, index) => {
    if (keyExtractor) return keyExtractor(row, index)
    return row.id ?? row._id ?? String(index)
  }

  const renderValue = (column, row) => {
    const raw = row[column.key]
    if (column.render) return column.render(raw, row)
    if (raw == null || raw === '') return '—'
    return String(raw)
  }

  if (!data.length) {
    return (
      <EmptyState title={emptyTitle} message={emptyMessage} style={style} />
    )
  }

  if (!isTablet) {
    return (
      <View style={[styles.cards, style]} testID={testID}>
        {data.map((row, index) => (
          <Pressable
            key={getKey(row, index)}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
            style={({ pressed }) => [
              styles.card,
              pressed && onRowPress && styles.pressed,
            ]}
            accessibilityRole={onRowPress ? 'button' : undefined}
          >
            {columns.map((column) => {
              const content = renderValue(column, row)
              return (
                <View key={column.key} style={styles.cardRow}>
                  <Text style={styles.cardLabel} allowFontScaling>
                    {column.title}
                  </Text>
                  <View style={styles.cardValue}>
                    {typeof content === 'string' || typeof content === 'number' ? (
                      <Text
                        style={styles.cardValueText}
                        allowFontScaling
                        numberOfLines={3}
                      >
                        {content}
                      </Text>
                    ) : (
                      content
                    )}
                  </View>
                </View>
              )
            })}
          </Pressable>
        ))}
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      style={[styles.tableScroll, style]}
      contentContainerStyle={styles.tableScrollContent}
      testID={testID}
    >
      <View style={styles.table}>
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <View
              key={column.key}
              style={[
                styles.cell,
                column.width ? { width: column.width } : { flex: column.flex || 1 },
              ]}
            >
              <Text style={styles.headerText} allowFontScaling numberOfLines={1}>
                {column.title}
              </Text>
            </View>
          ))}
        </View>
        {data.map((row, index) => (
          <Pressable
            key={getKey(row, index)}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
            style={({ pressed }) => [
              styles.bodyRow,
              index % 2 === 1 && styles.altRow,
              pressed && onRowPress && styles.pressed,
            ]}
            accessibilityRole={onRowPress ? 'button' : undefined}
          >
            {columns.map((column) => {
              const content = renderValue(column, row)
              return (
                <View
                  key={column.key}
                  style={[
                    styles.cell,
                    column.width
                      ? { width: column.width }
                      : { flex: column.flex || 1 },
                    column.align === 'right' && styles.alignRight,
                    column.align === 'center' && styles.alignCenter,
                  ]}
                >
                  {typeof content === 'string' || typeof content === 'number' ? (
                    <Text style={styles.cellText} allowFontScaling numberOfLines={2}>
                      {content}
                    </Text>
                  ) : (
                    content
                  )}
                </View>
              )
            })}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 28,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.muted,
    width: 110,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    paddingTop: 2,
  },
  cardValue: {
    flex: 1,
  },
  cardValueText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  tableScroll: {
    flexGrow: 0,
  },
  tableScrollContent: {
    minWidth: '100%',
  },
  table: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minWidth: 640,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
    alignItems: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
    alignItems: 'center',
  },
  altRow: {
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.primaryMuted,
  },
  cell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  headerText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cellText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignCenter: {
    alignItems: 'center',
  },
})
