// Spacing scale — multiples of 4px
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Screen padding
export const screenPadding = {
  horizontal: 24,  // Figma uses 24px content padding
  vertical: 20,
} as const;

// Border radius from Figma Beauty Master
export const radius = {
  xs: 8,      // Small chips, tags
  sm: 12,     // Beauty Master tight cards
  md: 16,     // Beauty Master standard cards
  lg: 20,     // Inputs, medium buttons
  xl: 24,     // Large cards
  xxl: 28,    // Full-width CTA buttons (pill-like)
  full: 100,  // Pills, avatars
} as const;
