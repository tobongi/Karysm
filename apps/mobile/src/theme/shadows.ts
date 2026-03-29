import { Platform } from 'react-native';

// Shadow presets from Figma Beauty Master
export const shadows = {
  // Subtle card shadow — premium soft depth
  card: Platform.select({
    web: {
      boxShadow: '0 4px 20px rgba(90,56,60,0.08), 0 1px 4px rgba(90,56,60,0.04)',
    },
    default: {
      shadowColor: '#5A383C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 4,
    },
  }),

  // Elevated shadow for floating elements
  elevated: Platform.select({
    web: {
      boxShadow: '0 8px 32px rgba(90,56,60,0.12), 0 2px 8px rgba(90,56,60,0.06)',
    },
    default: {
      shadowColor: '#5A383C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 32,
      elevation: 8,
    },
  }),

  // Sticky bottom bar shadow
  bottomBar: Platform.select({
    web: {
      boxShadow: '0 -2px 12px rgba(167,115,102,0.08)',
    },
    default: {
      shadowColor: '#A77366',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 8,
    },
  }),

  // No shadow
  none: Platform.select({
    web: {
      boxShadow: 'none',
    },
    default: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }),
} as const;
