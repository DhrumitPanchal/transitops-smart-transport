import { BREAKPOINTS } from '@/hooks/useResponsive'

describe('responsive breakpoints', () => {
  it('exports phone, tablet, and largeTablet constants', () => {
    expect(BREAKPOINTS).toEqual({
      phone: 0,
      tablet: 768,
      largeTablet: 1024,
    })
  })

  it('keeps phone below tablet and tablet below largeTablet', () => {
    expect(BREAKPOINTS.phone).toBeLessThan(BREAKPOINTS.tablet)
    expect(BREAKPOINTS.tablet).toBeLessThan(BREAKPOINTS.largeTablet)
  })
})
