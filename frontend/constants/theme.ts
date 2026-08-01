export const colors = {
  // Warm, reassuring palette — soft blues & greens
  primary: '#2E7D6B', // calming teal-green
  primaryDark: '#1B5E50',
  primaryLight: '#E8F5F0',

  accent: '#3B7DD8', // soft blue
  accentDark: '#1E5BB0',
  accentLight: '#E3EFFC',

  surface: '#FFFFFF',
  surfaceAlt: '#F7FAF9',
  surfaceDim: '#EEF4F2',

  text: '#1A2F2A',
  textOnPrimary: '#FFFFFF',
  textInverse: '#FFFFFF',
  muted: '#5C7068', // used sparingly, still meets contrast on light bg

  success: '#2E7D6B',
  warning: '#E8A33D',
  error: '#D8453B',

  background: '#F4F8F7',
  overlay: 'rgba(26, 47, 42, 0.45)',
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  // Large, accessible sizes — no small text
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
  heading: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  body: { fontSize: 20, lineHeight: 28, fontWeight: '500' as const },
  bodyLarge: { fontSize: 22, lineHeight: 30, fontWeight: '600' as const },
  caption: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const }, // 18px minimum
} as const;

export const fontFamilies = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-Medium',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
} as const;
