/**
 * closeBy Design Tokens
 * Direction: calm, warm, editorial — a printed health diary, not a SaaS template.
 */

export const colors = {
  // Paper & Surfaces
  background: '#F6F1E7',
  surface: '#FFFDF8',
  surfaceSubtle: '#EFE8DA',

  // Ink hierarchy
  ink: '#14231F',
  inkMuted: 'rgba(20, 35, 31, 0.70)',
  inkSubtle: 'rgba(20, 35, 31, 0.50)',

  // 1px Hairline borders (ink at 10% default)
  border: 'rgba(20, 35, 31, 0.10)',
  borderStrong: 'rgba(20, 35, 31, 0.22)',

  // Brand Primary — Deep Forest Teal
  primary: '#1F4D45',
  primaryPressed: '#173B35',
  primarySoft: 'rgba(31, 77, 69, 0.10)',
  onPrimary: '#FFFDF8',

  // Focal Accent — Marigold (STRICT: at most ONE focal accent per screen)
  accent: '#E8A317',
  accentPressed: '#CC8D10',
  accentSoft: 'rgba(232, 163, 23, 0.16)',
  accentInk: '#7A5100',

  // Alert — Terracotta (emergency 108/112, errors, doctor consult flag, destructive)
  alert: '#C4452D',
  alertPressed: '#A33722',
  alertSoft: 'rgba(196, 69, 45, 0.10)',
  onAlert: '#FFFDF8',
} as const;

export const radii = {
  card: 14,
  button: 14,
  input: 12,
  pill: 999,
} as const;

export const borders = {
  hairline: 1,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

export const icons = {
  /** Single icon set only: lucide-react-native at 1.75 stroke */
  strokeWidth: 1.75,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 26,
} as const;

export const motion = {
  /** All interactive state transitions stay within 200-300ms */
  fast: 200,
  base: 240,
  slow: 300,
  /** Calm breathing cadence for current visit stage halo & skeleton loaders */
  pulseCycle: 1800,
  skeletonCycle: 1400,
} as const;

export const layout = {
  screenPadding: 20,
  maxContentWidth: 960,
  webDashboardMaxWidth: 1120,
  minTouchTarget: 48,
} as const;

export const theme = {
  colors,
  radii,
  borders,
  spacing,
  icons,
  motion,
  layout,
} as const;

export type Theme = typeof theme;
