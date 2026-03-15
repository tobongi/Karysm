// === Users ===
export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  avatar?: string | null;
  role: UserRole;
  isVerified: boolean;
  locale: string;
  lat?: number | null;
  lng?: number | null;
  pushToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  phone: string;
  iat?: number;
  exp?: number;
}

// === Providers ===
export type ProviderStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface Provider {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  bio?: string | null;
  status: ProviderStatus;
  city: string;
  commune?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  mobileRadius: number;
  isMobile: boolean;
  whatsappNumber?: string | null;
  instagramHandle?: string | null;
  payoutPhone?: string | null;
  currency: string;
  avgRating: number;
  totalReviews: number;
  totalBookings: number;
  responseRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// === Services ===
export interface ServiceCategory {
  id: string;
  name: string;
  nameEn?: string | null;
  icon?: string | null;
  slug: string;
  sortOrder: number;
}

export interface Service {
  id: string;
  providerId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceMin: number;
  priceMax?: number | null;
  isActive: boolean;
  sortOrder: number;
}

// === Availability ===
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface Availability {
  id: string;
  providerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// === Bookings ===
export type BookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DEPOSIT_PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'DISPUTED';

export type LocationType = 'CLIENT' | 'PROVIDER';

export interface Booking {
  id: string;
  ref: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  startTime: string;
  endTime: string;
  locationType: LocationType;
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  agreedPrice: number;
  currency: string;
  depositAmount?: number | null;
  depositPaid: boolean;
  transportRequested: boolean;
  status: BookingStatus;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  clientNotes?: string | null;
  providerNotes?: string | null;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// === Payments ===
export type PaymentIntentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
export type PaymentType = 'DEPOSIT' | 'FULL' | 'TIP';
export type PaymentMethod = 'MOMO' | 'CASH';

export interface PaymentIntent {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentIntentStatus;
  externalRef?: string | null;
  expiresAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// === Reviews ===
export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment?: string | null;
  photos: string[];
  tags: string[];
  isVisible: boolean;
  createdAt: Date;
}

// === Transport ===
export type TransportStatus = 'REQUESTED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
export type TransportMethod = 'WHATSAPP' | 'INDRIVE' | 'YANGO';

export interface TransportRequest {
  id: string;
  bookingId: string;
  method: TransportMethod;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedCost: number;
  actualCost?: number | null;
  status: TransportStatus;
  driverPhone?: string | null;
  driverName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// === API Response types ===
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// === Search ===
export type SearchSort = 'distance' | 'price_asc' | 'price_desc' | 'rating';

export interface SearchParams {
  q?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  provider: Provider;
  services: Service[];
  distance?: number;
  minPrice?: number;
}
