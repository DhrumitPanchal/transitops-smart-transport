import { useWindowDimensions } from 'react-native'

export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  largeTablet: 1024,
}

/**
 * Responsive helpers based on window width.
 * phone < 768, tablet >= 768, largeTablet >= 1024
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions()

  const isPhone = width < BREAKPOINTS.tablet
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.largeTablet
  const isLargeTablet = width >= BREAKPOINTS.largeTablet
  const isTabletUp = width >= BREAKPOINTS.tablet

  return {
    width,
    height,
    isPhone,
    isTablet,
    isLargeTablet,
    isTabletUp,
    breakpoints: BREAKPOINTS,
  }
}

export default useResponsive
