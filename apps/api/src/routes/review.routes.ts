import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { reviewSchema } from '../schemas';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import { asyncHandler } from '../middleware/error';
import { createNotification } from '../lib/notifications';

const router = Router();

// POST /api/reviews
router.post('/', authMiddleware, validateBody(reviewSchema), asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user!.userId;
  const { bookingId, rating, comment, photos, tags } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');
  if (booking.clientId !== clientId) throw new ForbiddenError();
  if (booking.status !== 'COMPLETED') throw new ValidationError('Can only review completed bookings');

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw new ValidationError('Already reviewed');

  const review = await prisma.review.create({
    data: {
      bookingId,
      clientId,
      providerId: booking.providerId,
      rating,
      comment,
      photos: photos || [],
      tags: tags || [],
    },
  });

  // Update provider average rating
  const stats = await prisma.review.aggregate({
    where: { providerId: booking.providerId, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.provider.update({
    where: { id: booking.providerId },
    data: {
      avgRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating,
    },
  });

  // Notify provider about the new review
  const provider = await prisma.provider.findUnique({
    where: { id: booking.providerId },
    select: { userId: true },
  });
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { name: true },
  });
  if (provider) {
    createNotification({
      userId: provider.userId,
      type: 'REVIEW_RECEIVED',
      title: 'Nouvel avis reçu',
      body: `${client?.name || 'Un client'} vous a donné ${rating} étoile${rating > 1 ? 's' : ''}`,
      data: { bookingId },
    }).catch(err => console.error('Review notification error:', err));
  }

  res.status(201).json({ success: true, data: review });
}));

// GET /api/reviews/provider/:providerId
router.get('/provider/:providerId', asyncHandler(async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { providerId: req.params.providerId as string, isVisible: true },
    include: { client: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: reviews });
}));

export default router;
