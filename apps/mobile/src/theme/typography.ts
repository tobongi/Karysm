import { Platform } from 'react-native';

// Font families — Beauty Master uses Poppins + Playfair Display
export const fonts = {
  // Poppins — body, buttons, labels, all UI text
  body: Platform.select({
    web: 'Poppins, sans-serif',
    default: 'Poppins_400Regular',
  }),
  bodySemiBold: Platform.select({
    web: 'Poppins, sans-serif',
    default: 'Poppins_600SemiBold',
  }),
  bodyBold: Platform.select({
    web: 'Poppins, sans-serif',
    default: 'Poppins_700Bold',
  }),

  // Playfair Display — display titles, logo, hero text
  display: Platform.select({
    web: '"Playfair Display", serif',
    default: 'PlayfairDisplay_400Regular',
  }),
  displayBold: Platform.select({
    web: '"Playfair Display", serif',
    default: 'PlayfairDisplay_700Bold',
  }),
} as const;

// Type scale from Figma Beauty Master Design System
// H = heading (tight line height), L = body/paragraph (loose line height)
export const typeScale = {
  // Display — Playfair Display
  displayLarge: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 50,
  },
  displaySmall: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 42,
  },

  // Headings — Poppins
  h1: {
    fontFamily: fonts.bodyBold,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  h3: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  h4: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600' as const,
  },

  // Body — Poppins
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },

  // Labels & Captions — Poppins
  labelLarge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  labelMedium: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  labelSmall: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
  },

  // Button text
  buttonLarge: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 18,
  },
  buttonMedium: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 16,
  },
  buttonSmall: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600' as const,
  },
} as const;
