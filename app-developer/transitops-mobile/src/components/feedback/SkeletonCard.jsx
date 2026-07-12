import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '@/theme'

function Bone({ style }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return <Animated.View style={[styles.bone, { opacity }, style]} />
}

export default function SkeletonCard({
  lines = 3,
  showAvatar = false,
  style,
  accessibilityLabel = 'Loading content',
  testID,
}) {
  return (
    <View
      style={[styles.card, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View style={styles.header}>
        {showAvatar ? <Bone style={styles.avatar} /> : null}
        <View style={styles.headerText}>
          <Bone style={styles.title} />
          <Bone style={styles.subtitle} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone
          key={`line-${i}`}
          style={[styles.line, i === lines - 1 && styles.lineShort]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    height: 14,
    width: '55%',
    borderRadius: radius.xs,
  },
  subtitle: {
    height: 10,
    width: '35%',
    borderRadius: radius.xs,
  },
  bone: {
    backgroundColor: colors.borderStrong,
    borderRadius: radius.xs,
  },
  line: {
    height: 12,
    width: '100%',
    borderRadius: radius.xs,
  },
  lineShort: {
    width: '70%',
  },
})
