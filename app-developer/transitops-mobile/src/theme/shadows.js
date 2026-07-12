import { Platform } from 'react-native'
import { colors } from './colors'

const iosShadow = (offsetY, opacity, radius) => ({
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: radius,
})

const androidElevation = (elevation) => ({
  elevation,
})

export const shadows = {
  none: Platform.select({
    ios: iosShadow(0, 0, 0),
    android: androidElevation(0),
    default: {},
  }),
  sm: Platform.select({
    ios: iosShadow(1, 0.08, 2),
    android: androidElevation(2),
    default: {},
  }),
  md: Platform.select({
    ios: iosShadow(2, 0.1, 4),
    android: androidElevation(4),
    default: {},
  }),
  lg: Platform.select({
    ios: iosShadow(4, 0.12, 8),
    android: androidElevation(8),
    default: {},
  }),
  xl: Platform.select({
    ios: iosShadow(8, 0.14, 16),
    android: androidElevation(12),
    default: {},
  }),
}

export default shadows
