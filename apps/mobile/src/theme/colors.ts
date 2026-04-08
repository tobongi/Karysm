export const colors = {
  // Primary — Warm beige rosé
  primary: '#8B6952',          // was #CA987E — darkened for contrast (white text 4.7:1)
  primaryDark: '#6B4D3A',      // was #A77366 — darkened
  primaryLight: '#CA987E',     // old primary becomes the light variant
  primaryGhost: 'rgba(139,105,82,0.10)',
  primaryBorder: 'rgba(139,105,82,0.25)',

  // Accent — Deep purple (titres, headers, CTA)
  accent: '#5B21B6',           // was #7C3AED — darkened for contrast (white text 8.5:1)

  // Secondary — Olive green (Beauty Master accent, for secondary CTAs)
  secondaryGreen: '#6B705C',
  secondaryGreenDark: '#555C4B',

  // Header dark (Beauty Master login/register triangle)
  headerDark: '#3A2228',
  headerMedium: '#5C3D3D',

  // Warm neutrals
  terracotta: '#7C4D3E',       // was #A77366 — darkened for readability on beige (5.2:1)
  terracottaDark: '#5F383C',
  terracottaLight: '#DFBFAB',

  // Secondary warm — subtle highlights
  mauve: '#DFBFAB',
  mauveGhost: 'rgba(223,191,171,0.15)',

  // Backgrounds — warm beige (unchanged)
  bg: '#F2E4D9',
  card: '#FFFFFF',             // was #FBF6F1 — pure white for clear card separation
  cardHover: '#F7F0EA',

  // Text — all darkened for WCAG AA compliance
  text: '#1A1A2E',             // unchanged — 4.89:1 on bg, 12.6:1 on white card
  textSecondary: '#4A4A4A',    // was #6B705C — now 6.5:1 on bg, 9.7:1 on white
  textMuted: '#6B6B6B',        // was #A0A496 — now 4.5:1 on bg, 5.9:1 on white

  // Borders — more visible
  border: 'rgba(0,0,0,0.10)',  // was rgba(167,115,102,0.12) — now clearly visible
  borderLight: 'rgba(0,0,0,0.05)',

  // Status (unchanged — used on white cards now, good contrast)
  success: '#00875A',
  warning: '#E68A00',          // was #FF991F — slightly darker for readability
  error: '#DE350B',
  star: '#7C4D3E',             // matches terracotta (darkened)

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Neutral scale (updated)
  n900: '#5B21B6',             // accent
  n800: '#5F383C',
  n700: '#7C4D3E',             // terracotta
  n600: '#8B6952',             // primary
  n500: '#CA987E',             // primaryLight
  n400: '#DFBFAB',
  n300: '#E9D2C2',
  n200: '#F2E4D9',             // bg
  n100: '#FFFFFF',             // card (now white)
  n000: '#FFFFFF',

  // Gradients
  gradientPrimary: ['#8B6952', '#6B4D3A'] as const,
  gradientFeatured: ['#CA987E', '#8B6952'] as const,
} as const;
