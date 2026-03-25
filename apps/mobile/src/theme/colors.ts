export const colors = {
  // Primary — Violet
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#A78BFA',
  primaryGhost: 'rgba(124,58,237,0.08)',
  primaryBorder: 'rgba(124,58,237,0.2)',

  // Accent — Deep purple (titres, headers)
  accent: '#2D1B69',

  // Terracotta — Etoiles, prix, accents chauds
  terracotta: '#E07A5F',
  terracottaDark: '#C96B52',
  terracottaLight: '#F0A78D',

  // Rose mauve — badges, highlights subtils
  mauve: '#C9668E',
  mauveGhost: 'rgba(201,102,142,0.1)',

  // Backgrounds
  bg: '#FAF5FF',           // Off-white lavande tres leger
  card: '#FFFFFF',
  cardHover: '#F5F0FF',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Borders
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(124,58,237,0.08)',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  star: '#E07A5F',          // Terracotta pour les etoiles

  // Base
  white: '#FFFFFF',
  black: '#000000',

  // Gradients (pour usage avec LinearGradient)
  gradientPurple: ['#7C3AED', '#6D28D9'] as const,
  gradientFeatured: ['#7C3AED', '#A78BFA'] as const,
} as const;
