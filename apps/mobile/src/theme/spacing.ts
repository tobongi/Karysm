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
  sm: 16,     // Small buttons, chips
  md: 20,     // Medium buttons, inputs
  lg: 24,     // Cards, large buttons
  xl: 28,     // Full-width CTA buttons (pill-like)
  full: 100,  // Pills, avatars
} as const;
