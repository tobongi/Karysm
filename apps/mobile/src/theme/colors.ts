export const colors = {
  // Primary — Warm beige rosé (Beauty Master Br400/CA987E)
  primary: '#CA987E',
  primaryDark: '#A77366',
  primaryLight: '#D5AC94',
  primaryGhost: 'rgba(202,152,126,0.08)',
  primaryBorder: 'rgba(202,152,126,0.2)',

  // Accent — Deep purple (titres, headers)
  accent: '#7C3AED',

  // Warm neutrals — from Beauty Master N700/N800
  terracotta: '#A77366',
  terracottaDark: '#5F383C',
  terracottaLight: '#DFBFAB',

  // Secondary warm — subtle highlights
  mauve: '#DFBFAB',
  mauveGhost: 'rgba(223,191,171,0.15)',

  // Backgrounds — warm beige
  bg: '#F2E4D9',
  card: '#FBF6F1',
  cardHover: '#F2E4D9',

  // Text
  text: '#1A1A2E',
  textSecondary: '#6B705C',
  textMuted: '#A0A496',

  // Borders — warm-toned
  border: 'rgba(167,115,102,0.12)',
  borderLight: 'rgba(202,152,126,0.08)',

  // Status
  success: '#00875A',
  warning: '#FF991F',
  error: '#DE350B',
  star: '#A77366',

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Neutral scale (Beauty Master)
  n900: '#7C3AED',   // was #2D1B69, softened per user request
  n800: '#5F383C',
  n700: '#A77366',
  n600: '#CA987E',
  n500: '#D5AC94',
  n400: '#DFBFAB',
  n300: '#E9D2C2',
  n200: '#F2E4D9',
  n100: '#FBF6F1',
  n000: '#FFFFFF',

  // Gradients
  gradientPrimary: ['#CA987E', '#A77366'] as const,
  gradientFeatured: ['#D5AC94', '#CA987E'] as const,
} as const;
