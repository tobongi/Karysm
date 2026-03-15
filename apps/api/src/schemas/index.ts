import { z } from 'zod';

export const otpSendSchema = z.object({
  phone: z.string().min(9).max(15),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(9).max(15),
  otp: z.string().length(4),
});

export const registerSchema = z.object({
  phone: z.string().min(9).max(15),
  name: z.string().min(2).max(100),
  otp: z.string().length(4),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const providerProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  city: z.string().min(2),
  commune: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isMobile: z.boolean().optional(),
  mobileRadius: z.number().min(1).max(50).optional(),
  whatsappNumber: z.string().optional(),
  instagramHandle: z.string().optional(),
  payoutPhone: z.string().optional(),
  currency: z.enum(['CDF', 'XAF']).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  categoryId: z.string(),
  description: z.string().max(500).optional(),
  durationMin: z.number().min(5).max(480),
  priceMin: z.number().min(0),
  priceMax: z.number().min(0).optional(),
});

export const availabilitySchema = z.object({
  schedule: z.array(z.object({
    dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isActive: z.boolean().optional(),
  })),
});

export const createBookingSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  date: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  locationType: z.enum(['CLIENT', 'PROVIDER']).optional(),
  locationAddress: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  clientNotes: z.string().max(500).optional(),
  transportRequested: z.boolean().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'DISPUTED']),
  reason: z.string().optional(),
  providerNotes: z.string().optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  photos: z.array(z.string()).max(5).optional(),
  tags: z.array(z.string()).max(5).optional(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(50).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['distance', 'price_asc', 'price_desc', 'rating']).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});
