export const colors = {
  primary: '#0f766e',
  primaryDark: '#0d5f59',
  primaryLight: '#14b8a6',
  primaryMuted: '#ccfbf1',

  sidebar: '#0f172a',
  sidebarHover: '#1e293b',
  sidebarText: '#f1f5f9',
  sidebarMuted: '#94a3b8',

  surface: '#f8fafc',
  surfaceElevated: '#ffffff',
  background: '#f8fafc',

  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  text: '#0f172a',
  textSecondary: '#334155',
  muted: '#64748b',
  placeholder: '#94a3b8',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Status palette
  green: '#059669',
  greenMuted: '#ecfdf5',
  amber: '#d97706',
  amberMuted: '#fffbeb',
  blue: '#0284c7',
  blueMuted: '#f0f9ff',
  red: '#dc2626',
  redMuted: '#fef2f2',
  gray: '#6b7280',
  grayMuted: '#f3f4f6',

  // Semantic
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  warningBg: '#fffbeb',
  info: '#0284c7',
  infoBg: '#f0f9ff',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  error: '#dc2626',
  errorBg: '#fef2f2',

  overlay: 'rgba(15, 23, 42, 0.45)',
  chart: {
    primary: '#0f766e',
    blue: '#0369a1',
    amber: '#b45309',
    red: '#be123c',
    gray: '#4b5563',
  },
}

export const statusColors = {
  AVAILABLE: { bg: colors.greenMuted, text: colors.green },
  ON_TRIP: { bg: colors.blueMuted, text: colors.blue },
  IN_SHOP: { bg: colors.amberMuted, text: colors.amber },
  RETIRED: { bg: colors.grayMuted, text: colors.gray },
  OFF_DUTY: { bg: colors.grayMuted, text: colors.gray },
  SUSPENDED: { bg: colors.redMuted, text: colors.red },
  DRAFT: { bg: colors.grayMuted, text: colors.gray },
  DISPATCHED: { bg: colors.blueMuted, text: colors.blue },
  COMPLETED: { bg: colors.greenMuted, text: colors.green },
  CANCELLED: { bg: colors.redMuted, text: colors.red },
  OPEN: { bg: colors.amberMuted, text: colors.amber },
  IN_PROGRESS: { bg: colors.blueMuted, text: colors.blue },
  PENDING: { bg: colors.amberMuted, text: colors.amber },
  ACTIVE: { bg: colors.greenMuted, text: colors.green },
  INACTIVE: { bg: colors.grayMuted, text: colors.gray },
}

export default colors
