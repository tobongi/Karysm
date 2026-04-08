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
  { name: 'Coiffure', nameEn: 'Hair', icon: '💇', slug: 'coiffure', children: [
    { name: 'Tresses', slug: 'tresses' },
    { name: 'Tissage', slug: 'tissage' },
    { name: 'Locks', slug: 'locks' },
    { name: 'Coupe', slug: 'coupe' },
    { name: 'Lissage', slug: 'lissage' },
    { name: 'Soins capillaires', slug: 'soins-capillaires' },
  ]},
  { name: 'Ongles', nameEn: 'Nails', icon: '💅', slug: 'ongles', children: [
    { name: 'Manucure', slug: 'manucure' },
    { name: 'Gel UV', slug: 'gel-uv' },
    { name: 'Extension', slug: 'extension-ongles' },
    { name: 'Nail art', slug: 'nail-art' },
    { name: 'Pédicure', slug: 'pedicure' },
  ]},
  { name: 'Maquillage', nameEn: 'Makeup', icon: '💄', slug: 'maquillage', children: [
    { name: 'Maquillage jour', slug: 'maquillage-jour' },
    { name: 'Maquillage soirée', slug: 'maquillage-soiree' },
    { name: 'Maquillage mariée', slug: 'maquillage-mariee' },
  ]},
  { name: 'Soins', nameEn: 'Care', icon: '💆', slug: 'soins', children: [
    { name: 'Soins visage', slug: 'soins-visage' },
    { name: 'Soins corps', slug: 'soins-corps' },
    { name: 'Massage relaxant', slug: 'massage-relaxant' },
    { name: 'Massage drainant', slug: 'massage-drainant' },
    { name: 'Soins pieds', slug: 'soins-pieds' },
  ]},
  { name: 'Barbier', nameEn: 'Barber', icon: '✂️', slug: 'barber', children: [
    { name: 'Coupe homme', slug: 'coupe-homme' },
    { name: 'Barbe', slug: 'barbe' },
    { name: 'Rasage', slug: 'rasage' },
  ]},
  { name: 'Spa', nameEn: 'Spa', icon: '🧖', slug: 'spa', children: [
    { name: 'Hammam', slug: 'hammam' },
    { name: 'Sauna', slug: 'sauna' },
    { name: 'Soin complet', slug: 'soin-complet' },
  ]},
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
