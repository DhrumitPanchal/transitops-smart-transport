import React, { useMemo } from 'react'
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { colors, spacing, typography, radius } from '@/theme'

export default function SimpleBarChart({
  title,
  labels = [],
  data = [],
  height = 220,
  color = colors.chart.primary,
  style,
  yAxisSuffix = '',
  showValuesOnTopOfBars = false,
  accessibilityLabel,
  testID,
}) {
  const { width: windowWidth } = useWindowDimensions()
  const chartWidth = Math.max(280, windowWidth - spacing.lg * 4)

  const chartData = useMemo(
    () => ({
      labels: labels.length ? labels : [''],
      datasets: [
        {
          data: data.length ? data.map((n) => Number(n) || 0) : [0],
        },
      ],
    }),
    [labels, data],
  )

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || title || 'Bar chart'}
      testID={testID}
    >
      {title ? (
        <Text style={styles.title} allowFontScaling>
          {title}
        </Text>
      ) : null}
      <BarChart
        data={chartData}
        width={chartWidth}
        height={height}
        yAxisSuffix={yAxisSuffix}
        yAxisInterval={1}
        showValuesOnTopOfBars={showValuesOnTopOfBars}
        chartConfig={{
          backgroundColor: colors.surfaceElevated,
          backgroundGradientFrom: colors.surfaceElevated,
          backgroundGradientTo: colors.surfaceElevated,
          decimalPlaces: 0,
          color: (opacity = 1) => {
            const hex = color.replace('#', '')
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${opacity})`
          },
          labelColor: () => colors.muted,
          propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: '',
          },
          barPercentage: 0.6,
        }}
        style={styles.chart}
        fromZero
        withInnerLines
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chart: {
    borderRadius: radius.md,
    marginLeft: -spacing.sm,
  },
})
