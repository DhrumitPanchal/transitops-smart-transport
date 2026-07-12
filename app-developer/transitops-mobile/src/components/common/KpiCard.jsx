import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native'
import Card from './Card'
import { colors, spacing, typography, radius } from '@/theme'

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  accentColor = colors.primary,
  onPress,
  style,
  accessibilityLabel,
  testID,
}) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? colors.success : trend === 'down' ? colors.danger : colors.muted

  const a11y = accessibilityLabel || `${title}: ${value}${trendLabel ? `, ${trendLabel}` : ''}`

  return (
    <Card
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityLabel={a11y}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={styles.title} allowFontScaling numberOfLines={2}>
          {title}
        </Text>
        {Icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
            <Icon size={18} color={accentColor} strokeWidth={2} />
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.value, { color: colors.text }]}
        allowFontScaling
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {(subtitle || trendLabel) ? (
        <View style={styles.footer}>
          {trend ? (
            <View style={styles.trendRow}>
              <TrendIcon size={14} color={trendColor} strokeWidth={2.5} />
              {trendLabel ? (
                <Text style={[styles.trendLabel, { color: trendColor }]} allowFontScaling>
                  {trendLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} allowFontScaling numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  trendLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
})
