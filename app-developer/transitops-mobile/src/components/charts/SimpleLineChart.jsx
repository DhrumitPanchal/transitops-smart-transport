import React, { useMemo } from 'react'
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { colors, spacing, typography, radius } from '@/theme'

export default function SimpleLineChart({
  title,
  labels = [],
  data = [],
  datasets,
  height = 220,
  color = colors.chart.primary,
  style,
  yAxisSuffix = '',
  bezier = true,
  accessibilityLabel,
  testID,
}) {
  const { width: windowWidth } = useWindowDimensions()
  const chartWidth = Math.max(280, windowWidth - spacing.lg * 4)

  const chartData = useMemo(() => {
    if (datasets?.length) {
      return {
        labels: labels.length ? labels : [''],
        datasets,
      }
    }
    return {
      labels: labels.length ? labels : [''],
      datasets: [
        {
          data: data.length ? data.map((n) => Number(n) || 0) : [0],
          color: (opacity = 1) => {
            const hex = color.replace('#', '')
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${opacity})`
          },
          strokeWidth: 2,
        },
      ],
    }
  }, [labels, data, datasets, color])

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || title || 'Line chart'}
      testID={testID}
    >
      {title ? (
        <Text style={styles.title} allowFontScaling>
          {title}
        </Text>
      ) : null}
      <LineChart
        data={chartData}
        width={chartWidth}
        height={height}
        yAxisSuffix={yAxisSuffix}
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
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: color,
          },
          propsForBackgroundLines: {
            stroke: colors.border,
          },
        }}
        bezier={bezier}
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
