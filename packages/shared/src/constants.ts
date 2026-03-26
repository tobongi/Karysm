export const API_PORT = 3001;

export const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DEPOSIT_PAID', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  DEPOSIT_PAID: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  NO_SHOW: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

export const DEPOSIT_PERCENTAGE = 0.30; // 30% deposit

export const SERVICE_CATEGORIES = [
  { name: 'Coiffure', nameEn: 'Hair', icon: '💇', slug: 'coiffure' },
  { name: 'Ongles', nameEn: 'Nails', icon: '💅', slug: 'ongles' },
  { name: 'Maquillage', nameEn: 'Makeup', icon: '💄', slug: 'maquillage' },
  { name: 'Massage', nameEn: 'Massage', icon: '💆', slug: 'massage' },
  { name: 'Barber', nameEn: 'Barber', icon: '✂️', slug: 'barber' },
  { name: 'Spa', nameEn: 'Spa', icon: '🧖', slug: 'spa' },
] as const;

export const CITIES = [
  { name: 'Kinshasa', country: 'RDC', countryCode: '243', currency: 'CDF' },
  { name: 'Douala', country: 'Cameroun', countryCode: '237', currency: 'XAF' },
  { name: 'Libreville', country: 'Gabon', countryCode: '241', currency: 'XAF' },
  { name: 'Abidjan', country: 'Côte d\'Ivoire', countryCode: '225', currency: 'XAF' },
  { name: 'Dakar', country: 'Sénégal', countryCode: '221', currency: 'XAF' },
] as const;

export const CURRENCIES = {
  CDF: { code: 'CDF', symbol: 'FC', name: 'Franc Congolais' },
  XAF: { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA' },
} as const;

export const TRANSPORT_COST_RANGE = { min: 500, max: 2000 }; // CDF/XAF

export const REVIEW_TAGS = [
  'ponctuel', 'professionnel', 'propre', 'bon_prix', 'creatif', 'rapide', 'accueillant',
] as const;

export const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

// Colors (design system)
export const COLORS = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#A78BFA',
  accent: '#2D1B69',
  terracotta: '#E07A5F',
  bg: '#FAF5FF',
  card: '#FFFFFF',
  cardHover: '#F5F0FF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: 'rgba(0,0,0,0.06)',
  borderPrimary: 'rgba(124,58,237,0.2)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  star: '#E07A5F',
} as const;
