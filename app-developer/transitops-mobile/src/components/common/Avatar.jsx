import React, { useMemo } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { colors } from '@/theme'

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function hashColor(seed) {
  const palette = [
    colors.primary,
    colors.blue,
    colors.amber,
    colors.green,
    '#7c3aed',
    '#db2777',
  ]
  let hash = 0
  const str = String(seed || '')
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

export default function Avatar({
  name,
  uri,
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}) {
  const dim = typeof size === 'number' ? size : SIZES[size] || SIZES.md
  const initials = useMemo(() => getInitials(name), [name])
  const bg = useMemo(() => hashColor(name || uri || 'user'), [name, uri])
  const fontSize = Math.round(dim * 0.36)

  return (
    <View
      style={[
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: uri ? colors.border : bg,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `Avatar for ${name || 'user'}`}
      testID={testID}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          style={[styles.initials, { fontSize, lineHeight: fontSize * 1.2 }]}
          allowFontScaling
        >
          {initials}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
})
